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
    theme: 'dark'
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
    
    // Settings state
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('dbgraph_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                return { ...defaultSettings, ...parsed, joinColors: { ...defaultSettings.joinColors, ...parsed.joinColors } };
            }
        } catch (e) {
            console.error('Error loading settings:', e);
        }
        return defaultSettings;
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
    
    // Pathfinding state
    const [pathfindingMode, setPathfindingMode] = useState(false);
    const [pathStart, setPathStart] = useState(null);
    const [pathEnd, setPathEnd] = useState(null);
    const [foundPath, setFoundPath] = useState(null);

    // Connection mode (for creating relations from nodes)
    const [connectionMode, setConnectionMode] = useState(false);
    const [connectionSource, setConnectionSource] = useState(null);

    // Save settings to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('dbgraph_settings', JSON.stringify(settings));
        } catch (e) {
            console.error('Error saving settings:', e);
        }
    }, [settings]);

    // Save original IDs
    useEffect(() => {
        try {
            localStorage.setItem('dbgraph_original_ids', JSON.stringify(originalImportedIds));
        } catch (e) {
            console.error('Error saving original IDs:', e);
        }
    }, [originalImportedIds]);

    // Save last SQL
    useEffect(() => {
        try {
            localStorage.setItem('dbgraph_last_sql', lastImportedSql);
        } catch (e) {
            console.error('Error saving SQL:', e);
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
                if (key === 'joinColors') {
                    updated.joinColors = { ...prev.joinColors, ...newSettings.joinColors };
                } else {
                    updated[key] = newSettings[key];
                }
            });
            return updated;
        });
    }, []);

    const resetSettings = useCallback(() => {
        setSettings(defaultSettings);
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

    // Import SQL
    const importSql = useCallback(async (sql, isInitialImport = true) => {
        try {
            const response = await axios.post(`${API}/import-sql`, { sql });
            
            if (isInitialImport) {
                setLastImportedSql(sql);
                // Fetch the newly created data to get IDs
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
        const name = view.name ? `'${view.name}'` : 'NULL';
        const name2 = view.name2 ? `'${view.name2}'` : 'NULL';
        const alias = view.alias ? `'${view.alias}'` : 'NULL';
        
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
        
        if (type === 'INSERT') {
            return `INSERT INTO Report_ViewRelation (IdView1, IdView2, Relation, Relation2, EdgeWeight, MinAppVersion, MaxAppVersion, ChangeOwner) VALUES(${relation.source || relation.id_view1}, ${relation.target || relation.id_view2}, ${rel1}, ${rel2}, ${weight}, 2000000, 999999999, 1);`;
        } else {
            return `UPDATE Report_ViewRelation SET Relation = ${rel1}, Relation2 = ${rel2}, EdgeWeight = ${weight} WHERE IdView1 = ${relation.source || relation.id_view1} AND IdView2 = ${relation.target || relation.id_view2};`;
        }
    }, []);

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
            setOriginalImportedIds({ views: [], relations: [] });
            setLastImportedSql('');
            await fetchData();
        } catch (err) {
            console.error('Error clearing data:', err);
            throw err;
        }
    }, [fetchData, clearPathfinding, clearConnectionMode]);

    // Filter views based on search
    const filteredViews = views.filter(view => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            view.display_name?.toLowerCase().includes(query) ||
            view.name?.toLowerCase().includes(query) ||
            view.alias?.toLowerCase().includes(query) ||
            String(view.view_id).includes(query)
        );
    });

    // Get new views and relations
    const newViews = views.filter(v => isNewView(v.view_id));
    const newRelations = relations.filter(r => isNewRelation(r.id));

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
        exportViewAsSql,
        exportRelationAsSql,
        
        // Data
        views,
        relations,
        filteredViews,
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
        clearAllData
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
