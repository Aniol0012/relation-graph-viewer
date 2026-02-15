import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AppContext = createContext(null);

// Default settings
const defaultSettings = {
    // Display
    showViewId: true,
    showAlias: true,
    maxNodeNameLength: 20,
    nodeSize: 'medium',
    
    // Colors per join type
    joinColors: {
        'LEFT JOIN': '#3B82F6',
        'RIGHT JOIN': '#8B5CF6',
        'INNER JOIN': '#10B981',
        'CROSS JOIN': '#F59E0B',
        'FULL JOIN': '#EC4899',
        'JOIN': '#6366F1',
        'DEFAULT': '#71717A'
    },
    
    // Layout
    layoutDirection: 'TB',
    nodeSpacing: 80,
    levelSpacing: 120,
    
    // Edges
    edgeStyle: 'smoothstep',
    showEdgeLabels: true,
    animatedEdges: false,
    
    // Theme
    theme: 'dark',
    
    // Details panel width
    detailsPanelWidth: 380
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
};

export const AppProvider = ({ children }) => {
    // React Flow instance ref
    const reactFlowInstance = useRef(null);
    
    // Settings state - load safely
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('dbgraph_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                return { 
                    ...defaultSettings, 
                    ...parsed, 
                    joinColors: { ...defaultSettings.joinColors, ...(parsed.joinColors || {}) } 
                };
            }
        } catch (e) {
            console.warn('Error loading settings:', e);
        }
        return { ...defaultSettings };
    });

    // Original imported data (to track what's new)
    const [originalImportedIds, setOriginalImportedIds] = useState(() => {
        try {
            const saved = localStorage.getItem('dbgraph_original_ids');
            return saved ? JSON.parse(saved) : { views: [], relations: [] };
        } catch (e) {
            return { views: [], relations: [] };
        }
    });

    // Last imported SQL script
    const [lastImportedSql, setLastImportedSql] = useState(() => {
        return localStorage.getItem('dbgraph_last_sql') || '';
    });

    // Data state
    const [views, setViews] = useState([]);
    const [relations, setRelations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // UI state
    const [selectedView, setSelectedView] = useState(null);
    const [selectedRelation, setSelectedRelation] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({ views_count: 0, relations_count: 0 });
    
    // Filter state
    const [filterMode, setFilterMode] = useState(false); // Selection mode for filtering
    const [hiddenViews, setHiddenViews] = useState(new Set());
    const [selectedForFilter, setSelectedForFilter] = useState(new Set());
    
    // Pathfinding state
    const [pathfindingMode, setPathfindingMode] = useState(false);
    const [pathStart, setPathStart] = useState(null);
    const [pathEnd, setPathEnd] = useState(null);
    const [foundPath, setFoundPath] = useState(null);

    // Connection mode (for creating relations from nodes)
    const [connectionMode, setConnectionMode] = useState(false);
    const [connectionSource, setConnectionSource] = useState(null);

    // Save settings to localStorage - debounced
    useEffect(() => {
        const timeout = setTimeout(() => {
            try {
                localStorage.setItem('dbgraph_settings', JSON.stringify(settings));
            } catch (e) {
                console.warn('Error saving settings:', e);
            }
        }, 300);
        return () => clearTimeout(timeout);
    }, [settings]);

    // Save original IDs
    useEffect(() => {
        try {
            localStorage.setItem('dbgraph_original_ids', JSON.stringify(originalImportedIds));
        } catch (e) {
            console.warn('Error saving original IDs:', e);
        }
    }, [originalImportedIds]);

    // Save last SQL
    useEffect(() => {
        try {
            localStorage.setItem('dbgraph_last_sql', lastImportedSql);
        } catch (e) {
            console.warn('Error saving SQL:', e);
        }
    }, [lastImportedSql]);

    // Apply theme
    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(settings.theme);
    }, [settings.theme]);

    const updateSettings = useCallback((newSettings) => {
        setSettings(prev => {
            const updated = { ...prev };
            Object.keys(newSettings).forEach(key => {
                if (key === 'joinColors' && typeof newSettings.joinColors === 'object') {
                    updated.joinColors = { ...prev.joinColors, ...newSettings.joinColors };
                } else {
                    updated[key] = newSettings[key];
                }
            });
            return updated;
        });
    }, []);

    const resetSettings = useCallback(() => {
        setSettings({ ...defaultSettings });
    }, []);

    const toggleTheme = useCallback(() => {
        setSettings(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
    }, []);

    // Get join type from relation string
    const getJoinType = useCallback((relationStr) => {
        if (!relationStr) return 'DEFAULT';
        const upper = relationStr.toUpperCase();
        if (upper.includes('LEFT JOIN')) return 'LEFT JOIN';
        if (upper.includes('RIGHT JOIN')) return 'RIGHT JOIN';
        if (upper.includes('INNER JOIN')) return 'INNER JOIN';
        if (upper.includes('CROSS JOIN')) return 'CROSS JOIN';
        if (upper.includes('FULL JOIN') || upper.includes('FULL OUTER')) return 'FULL JOIN';
        if (upper.includes('JOIN')) return 'JOIN';
        return 'DEFAULT';
    }, []);

    // Get color for join type
    const getJoinColor = useCallback((relationStr) => {
        const joinType = getJoinType(relationStr);
        return settings.joinColors[joinType] || settings.joinColors['DEFAULT'];
    }, [getJoinType, settings.joinColors]);

    // Check if a view is new (not in original import)
    const isNewView = useCallback((viewId) => {
        return !originalImportedIds.views.includes(viewId);
    }, [originalImportedIds.views]);

    // Check if a relation is new
    const isNewRelation = useCallback((relationId) => {
        return !originalImportedIds.relations.includes(relationId);
    }, [originalImportedIds.relations]);

    // Get next available view ID
    const getNextViewId = useCallback(() => {
        if (views.length === 0) return 1;
        const maxId = Math.max(...views.map(v => v.view_id));
        return maxId + 1;
    }, [views]);

    // Focus on a node in the graph
    const focusOnNode = useCallback((nodeId) => {
        if (reactFlowInstance.current) {
            const node = reactFlowInstance.current.getNode(nodeId);
            if (node) {
                reactFlowInstance.current.fitView({
                    nodes: [node],
                    padding: 0.5,
                    duration: 500
                });
            }
        }
    }, []);

    // Copy to clipboard with fallback
    const copyToClipboard = useCallback(async (text) => {
        try {
            // Try modern API first
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            }
        } catch (err) {
            console.warn('Clipboard API failed, using fallback');
        }
        
        // Fallback: create textarea
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            return success;
        } catch (err) {
            console.error('Fallback clipboard failed:', err);
            return false;
        }
    }, []);

    // Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [graphRes, statsRes] = await Promise.all([
                axios.get(`${API}/graph-data`),
                axios.get(`${API}/stats`)
            ]);
            
            setViews(graphRes.data.nodes || []);
            setRelations(graphRes.data.edges || []);
            setStats(statsRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Error carregant les dades');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Pathfinding - BFS
    const findPath = useCallback((startId, endId) => {
        if (!startId || !endId || startId === endId) {
            setFoundPath(null);
            return null;
        }

        const adjacency = new Map();
        views.forEach(v => adjacency.set(v.id, []));
        
        relations.forEach(rel => {
            if (adjacency.has(rel.source)) {
                adjacency.get(rel.source).push({ target: rel.target, relation: rel });
            }
            if (adjacency.has(rel.target)) {
                adjacency.get(rel.target).push({ target: rel.source, relation: rel });
            }
        });

        const queue = [{ node: startId, path: [startId], edges: [] }];
        const visited = new Set([startId]);

        while (queue.length > 0) {
            const { node, path, edges } = queue.shift();
            
            if (node === endId) {
                const result = { nodes: path, edges };
                setFoundPath(result);
                return result;
            }

            const neighbors = adjacency.get(node) || [];
            for (const { target, relation } of neighbors) {
                if (!visited.has(target)) {
                    visited.add(target);
                    queue.push({
                        node: target,
                        path: [...path, target],
                        edges: [...edges, relation.id]
                    });
                }
            }
        }

        setFoundPath({ nodes: [], edges: [], notFound: true });
        return null;
    }, [views, relations]);

    // Clear pathfinding
    const clearPathfinding = useCallback(() => {
        setPathfindingMode(false);
        setPathStart(null);
        setPathEnd(null);
        setFoundPath(null);
    }, []);

    // Clear connection mode
    const clearConnectionMode = useCallback(() => {
        setConnectionMode(false);
        setConnectionSource(null);
    }, []);

    // Filter functions
    const toggleViewHidden = useCallback((viewId) => {
        setHiddenViews(prev => {
            const next = new Set(prev);
            if (next.has(viewId)) {
                next.delete(viewId);
            } else {
                next.add(viewId);
            }
            return next;
        });
    }, []);

    const toggleViewForFilter = useCallback((viewId) => {
        setSelectedForFilter(prev => {
            const next = new Set(prev);
            if (next.has(viewId)) {
                next.delete(viewId);
            } else {
                next.add(viewId);
            }
            return next;
        });
    }, []);

    const applyFilter = useCallback(() => {
        // Hide all views NOT in selectedForFilter
        const toHide = new Set();
        views.forEach(v => {
            if (!selectedForFilter.has(v.view_id)) {
                toHide.add(v.view_id);
            }
        });
        setHiddenViews(toHide);
        setFilterMode(false);
        setSelectedForFilter(new Set());
    }, [views, selectedForFilter]);

    const clearFilters = useCallback(() => {
        setHiddenViews(new Set());
        setSelectedForFilter(new Set());
        setFilterMode(false);
    }, []);

    const showOnlyConnected = useCallback((viewId) => {
        // Find all views connected to this one
        const connected = new Set([viewId]);
        relations.forEach(rel => {
            const sourceView = views.find(v => v.id === rel.source);
            const targetView = views.find(v => v.id === rel.target);
            if (sourceView?.view_id === viewId && targetView) {
                connected.add(targetView.view_id);
            }
            if (targetView?.view_id === viewId && sourceView) {
                connected.add(sourceView.view_id);
            }
        });
        
        const toHide = new Set();
        views.forEach(v => {
            if (!connected.has(v.view_id)) {
                toHide.add(v.view_id);
            }
        });
        setHiddenViews(toHide);
    }, [views, relations]);

    // Import SQL
    const importSql = useCallback(async (sql, isInitialImport = true) => {
        try {
            const response = await axios.post(`${API}/import-sql`, { sql });
            
            if (isInitialImport) {
                setLastImportedSql(sql);
                const graphRes = await axios.get(`${API}/graph-data`);
                const viewIds = (graphRes.data.nodes || []).map(v => v.view_id);
                const relationIds = (graphRes.data.edges || []).map(r => r.id);
                setOriginalImportedIds({ views: viewIds, relations: relationIds });
            }
            
            await fetchData();
            return response.data;
        } catch (err) {
            console.error('Error importing SQL:', err);
            throw err;
        }
    }, [fetchData]);

    // Export view as SQL
    const exportViewAsSql = useCallback((view, type = 'INSERT') => {
        const name = view.name ? `'${view.name.replace(/'/g, "''")}'` : 'NULL';
        const name2 = view.name2 ? `'${view.name2.replace(/'/g, "''")}'` : 'NULL';
        const alias = view.alias ? `'${view.alias.replace(/'/g, "''")}'` : 'NULL';
        
        if (type === 'INSERT') {
            return `INSERT INTO Report_View (IdView, Name, Name2, Alias) VALUES(${view.view_id}, ${name}, ${name2}, ${alias});`;
        } else {
            return `UPDATE Report_View SET Name = ${name}, Name2 = ${name2}, Alias = ${alias} WHERE IdView = ${view.view_id};`;
        }
    }, []);

    // Export relation as SQL
    const exportRelationAsSql = useCallback((relation, type = 'INSERT') => {
        const rel1 = relation.relation ? `'${relation.relation.replace(/'/g, "''")}'` : 'NULL';
        const rel2 = relation.relation2 ? `'${relation.relation2.replace(/'/g, "''")}'` : 'NULL';
        const weight = relation.edge_weight || 10;
        const idView1 = relation.source || relation.id_view1;
        const idView2 = relation.target || relation.id_view2;
        
        // Get numeric IDs
        const sourceView = views.find(v => v.id === idView1);
        const targetView = views.find(v => v.id === idView2);
        const numericId1 = sourceView?.view_id || idView1;
        const numericId2 = targetView?.view_id || idView2;
        
        if (type === 'INSERT') {
            return `INSERT INTO Report_ViewRelation (IdView1, IdView2, Relation, Relation2, EdgeWeight, MinAppVersion, MaxAppVersion, ChangeOwner) VALUES(${numericId1}, ${numericId2}, ${rel1}, ${rel2}, ${weight}, 2000000, 999999999, 1);`;
        } else {
            return `UPDATE Report_ViewRelation SET Relation = ${rel1}, Relation2 = ${rel2}, EdgeWeight = ${weight} WHERE IdView1 = ${numericId1} AND IdView2 = ${numericId2};`;
        }
    }, [views]);

    // CRUD operations
    const createView = useCallback(async (viewData) => {
        try {
            await axios.post(`${API}/views`, viewData);
            await fetchData();
        } catch (err) {
            console.error('Error creating view:', err);
            throw err;
        }
    }, [fetchData]);

    const updateView = useCallback(async (viewId, updateData) => {
        try {
            await axios.put(`${API}/views/${viewId}`, updateData);
            await fetchData();
        } catch (err) {
            console.error('Error updating view:', err);
            throw err;
        }
    }, [fetchData]);

    const deleteView = useCallback(async (viewId) => {
        try {
            await axios.delete(`${API}/views/${viewId}`);
            if (selectedView?.view_id === viewId) {
                setSelectedView(null);
            }
            await fetchData();
        } catch (err) {
            console.error('Error deleting view:', err);
            throw err;
        }
    }, [fetchData, selectedView]);

    const createRelation = useCallback(async (relationData) => {
        try {
            await axios.post(`${API}/relations`, relationData);
            await fetchData();
        } catch (err) {
            console.error('Error creating relation:', err);
            throw err;
        }
    }, [fetchData]);

    const updateRelation = useCallback(async (relationId, updateData) => {
        try {
            await axios.put(`${API}/relations/${relationId}`, updateData);
            await fetchData();
        } catch (err) {
            console.error('Error updating relation:', err);
            throw err;
        }
    }, [fetchData]);

    const deleteRelation = useCallback(async (relationId) => {
        try {
            await axios.delete(`${API}/relations/${relationId}`);
            if (selectedRelation?.id === relationId) {
                setSelectedRelation(null);
            }
            await fetchData();
        } catch (err) {
            console.error('Error deleting relation:', err);
            throw err;
        }
    }, [fetchData, selectedRelation]);

    const clearAllData = useCallback(async () => {
        try {
            await axios.delete(`${API}/clear-all`);
            setSelectedView(null);
            setSelectedRelation(null);
            clearPathfinding();
            clearConnectionMode();
            clearFilters();
            setOriginalImportedIds({ views: [], relations: [] });
            setLastImportedSql('');
            await fetchData();
        } catch (err) {
            console.error('Error clearing data:', err);
            throw err;
        }
    }, [fetchData, clearPathfinding, clearConnectionMode, clearFilters]);

    // Get new views and relations
    const newViews = views.filter(v => isNewView(v.view_id));
    const newRelations = relations.filter(r => isNewRelation(r.id));

    const clearNewItems = useCallback(async () => {
        try {
            const deletePromises = [];
            
            newRelations.forEach(rel => {
                deletePromises.push(axios.delete(`${API}/relations/${rel.id}`));
            });
            
            newViews.forEach(view => {
                deletePromises.push(axios.delete(`${API}/views/${view.view_id}`));
            });
            
            await Promise.all(deletePromises);
            
            if (selectedView && isNewView(selectedView.view_id)) {
                setSelectedView(null);
            }
            if (selectedRelation && isNewRelation(selectedRelation.id)) {
                setSelectedRelation(null);
            }
            
            await fetchData();
        } catch (err) {
            console.error('Error clearing new items:', err);
            throw err;
        }
    }, [newViews, newRelations, fetchData, selectedView, selectedRelation, isNewView, isNewRelation]);

    // Filter views based on search and hidden
    const filteredViews = views.filter(view => {
        // Check if hidden
        if (hiddenViews.has(view.view_id)) return false;
        
        // Check search
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            view.display_name?.toLowerCase().includes(query) ||
            view.name?.toLowerCase().includes(query) ||
            view.alias?.toLowerCase().includes(query) ||
            String(view.view_id).includes(query)
        );
    });

    // Visible views (not hidden)
    const visibleViews = views.filter(v => !hiddenViews.has(v.view_id));

    // Visible relations (both ends visible)
    const visibleRelations = relations.filter(rel => {
        const sourceView = views.find(v => v.id === rel.source);
        const targetView = views.find(v => v.id === rel.target);
        return sourceView && targetView && 
               !hiddenViews.has(sourceView.view_id) && 
               !hiddenViews.has(targetView.view_id);
    });


    const value = {
        // React Flow instance
        reactFlowInstance,
        
        // Settings
        settings,
        updateSettings,
        resetSettings,
        toggleTheme,
        defaultSettings,
        
        // Helpers
        getJoinType,
        getJoinColor,
        isNewView,
        isNewRelation,
        getNextViewId,
        focusOnNode,
        copyToClipboard,
        exportViewAsSql,
        exportRelationAsSql,
        
        // Data
        views,
        relations,
        filteredViews,
        visibleViews,
        visibleRelations,
        newViews,
        newRelations,
        loading,
        error,
        stats,
        lastImportedSql,
        
        // Selection
        selectedView,
        setSelectedView,
        selectedRelation,
        setSelectedRelation,
        
        // Search
        searchQuery,
        setSearchQuery,
        
        // Filters
        filterMode,
        setFilterMode,
        hiddenViews,
        selectedForFilter,
        toggleViewHidden,
        toggleViewForFilter,
        applyFilter,
        clearFilters,
        showOnlyConnected,
        
        // Pathfinding
        pathfindingMode,
        setPathfindingMode,
        pathStart,
        setPathStart,
        pathEnd,
        setPathEnd,
        foundPath,
        findPath,
        clearPathfinding,
        
        // Connection mode
        connectionMode,
        setConnectionMode,
        connectionSource,
        setConnectionSource,
        clearConnectionMode,
        
        // Actions
        fetchData,
        importSql,
        createView,
        updateView,
        deleteView,
        createRelation,
        updateRelation,
        deleteRelation,
        clearAllData,
        clearNewItems
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
