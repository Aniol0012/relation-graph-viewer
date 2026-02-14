import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
    nodeSize: 'medium', // small, medium, large
    
    // Colors per join type
    joinColors: {
        'LEFT JOIN': '#3B82F6',      // Blue
        'RIGHT JOIN': '#8B5CF6',     // Purple
        'INNER JOIN': '#10B981',     // Green
        'CROSS JOIN': '#F59E0B',     // Amber
        'FULL JOIN': '#EC4899',      // Pink
        'JOIN': '#6366F1',           // Indigo
        'DEFAULT': '#71717A'         // Gray
    },
    
    // Layout
    layoutDirection: 'TB', // TB (top-bottom), LR (left-right)
    nodeSpacing: 80,
    levelSpacing: 120,
    
    // Edges
    edgeStyle: 'smoothstep', // smoothstep, bezier, straight
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
    // Settings state
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('dbgraph_settings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
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

    // Save settings to localStorage
    useEffect(() => {
        localStorage.setItem('dbgraph_settings', JSON.stringify(settings));
    }, [settings]);

    // Apply theme
    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(settings.theme);
    }, [settings.theme]);

    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
        localStorage.removeItem('dbgraph_settings');
    };

    const toggleTheme = () => {
        updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
    };

    // Get join type from relation string
    const getJoinType = (relationStr) => {
        if (!relationStr) return 'DEFAULT';
        const upper = relationStr.toUpperCase();
        if (upper.includes('LEFT JOIN')) return 'LEFT JOIN';
        if (upper.includes('RIGHT JOIN')) return 'RIGHT JOIN';
        if (upper.includes('INNER JOIN')) return 'INNER JOIN';
        if (upper.includes('CROSS JOIN')) return 'CROSS JOIN';
        if (upper.includes('FULL JOIN') || upper.includes('FULL OUTER')) return 'FULL JOIN';
        if (upper.includes('JOIN')) return 'JOIN';
        return 'DEFAULT';
    };

    // Get color for join type
    const getJoinColor = (relationStr) => {
        const joinType = getJoinType(relationStr);
        return settings.joinColors[joinType] || settings.joinColors['DEFAULT'];
    };

    // Truncate name
    const truncateName = (name, maxLength) => {
        if (!name) return '';
        if (name.length <= maxLength) return name;
        return name.substring(0, maxLength - 2) + '..';
    };

    // Format display name for node
    const formatNodeDisplay = (view) => {
        const maxLen = settings.maxNodeNameLength;
        let displayName = view.alias || view.name || `View_${view.view_id}`;
        displayName = truncateName(displayName, maxLen);
        return displayName;
    };

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

        // Build adjacency list (bidirectional)
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

        // BFS
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
    const clearPathfinding = () => {
        setPathfindingMode(false);
        setPathStart(null);
        setPathEnd(null);
        setFoundPath(null);
    };

    // Import SQL
    const importSql = async (sql) => {
        try {
            const response = await axios.post(`${API}/import-sql`, { sql });
            await fetchData();
            return response.data;
        } catch (err) {
            console.error('Error importing SQL:', err);
            throw err;
        }
    };

    // CRUD operations
    const createView = async (viewData) => {
        try {
            await axios.post(`${API}/views`, viewData);
            await fetchData();
        } catch (err) {
            console.error('Error creating view:', err);
            throw err;
        }
    };

    const updateView = async (viewId, updateData) => {
        try {
            await axios.put(`${API}/views/${viewId}`, updateData);
            await fetchData();
        } catch (err) {
            console.error('Error updating view:', err);
            throw err;
        }
    };

    const deleteView = async (viewId) => {
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
    };

    const createRelation = async (relationData) => {
        try {
            await axios.post(`${API}/relations`, relationData);
            await fetchData();
        } catch (err) {
            console.error('Error creating relation:', err);
            throw err;
        }
    };

    const updateRelation = async (relationId, updateData) => {
        try {
            await axios.put(`${API}/relations/${relationId}`, updateData);
            await fetchData();
        } catch (err) {
            console.error('Error updating relation:', err);
            throw err;
        }
    };

    const deleteRelation = async (relationId) => {
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
    };

    const clearAllData = async () => {
        try {
            await axios.delete(`${API}/clear-all`);
            setSelectedView(null);
            setSelectedRelation(null);
            clearPathfinding();
            await fetchData();
        } catch (err) {
            console.error('Error clearing data:', err);
            throw err;
        }
    };

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

    const value = {
        // Settings
        settings,
        updateSettings,
        resetSettings,
        toggleTheme,
        defaultSettings,
        
        // Helpers
        getJoinType,
        getJoinColor,
        formatNodeDisplay,
        truncateName,
        
        // Data
        views,
        relations,
        filteredViews,
        loading,
        error,
        stats,
        
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
