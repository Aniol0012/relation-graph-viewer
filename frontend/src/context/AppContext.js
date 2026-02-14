import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AppContext = createContext(null);

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
};

export const AppProvider = ({ children }) => {
    // Theme state
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved || 'dark';
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

    // Apply theme
    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
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

    // Create view
    const createView = async (viewData) => {
        try {
            await axios.post(`${API}/views`, viewData);
            await fetchData();
        } catch (err) {
            console.error('Error creating view:', err);
            throw err;
        }
    };

    // Update view
    const updateView = async (viewId, updateData) => {
        try {
            await axios.put(`${API}/views/${viewId}`, updateData);
            await fetchData();
        } catch (err) {
            console.error('Error updating view:', err);
            throw err;
        }
    };

    // Delete view
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

    // Create relation
    const createRelation = async (relationData) => {
        try {
            await axios.post(`${API}/relations`, relationData);
            await fetchData();
        } catch (err) {
            console.error('Error creating relation:', err);
            throw err;
        }
    };

    // Update relation
    const updateRelation = async (relationId, updateData) => {
        try {
            await axios.put(`${API}/relations/${relationId}`, updateData);
            await fetchData();
        } catch (err) {
            console.error('Error updating relation:', err);
            throw err;
        }
    };

    // Delete relation
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

    // Clear all data
    const clearAllData = async () => {
        try {
            await axios.delete(`${API}/clear-all`);
            setSelectedView(null);
            setSelectedRelation(null);
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
        // Theme
        theme,
        toggleTheme,
        
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
