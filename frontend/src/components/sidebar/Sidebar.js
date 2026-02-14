import React from 'react';
import { useApp } from '../../context/AppContext';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Database, Search, Box, GitBranch } from 'lucide-react';

export const Sidebar = () => {
    const { 
        filteredViews, 
        searchQuery, 
        setSearchQuery,
        selectedView,
        setSelectedView,
        setSelectedRelation,
        stats
    } = useApp();

    const handleViewClick = (view) => {
        setSelectedView(view);
        setSelectedRelation(null);
    };

    return (
        <div className="sidebar" data-testid="sidebar">
            {/* Header */}
            <div className="sidebar-header">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-accent/10">
                        <Database className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                        <h1 className="font-heading font-semibold text-lg">
                            DB Graph
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Visualitzador d'estructura
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex gap-2 mb-4">
                    <div className="stats-badge">
                        <Box className="w-3 h-3" />
                        <span>{stats.views_count} vistes</span>
                    </div>
                    <div className="stats-badge">
                        <GitBranch className="w-3 h-3" />
                        <span>{stats.relations_count} relacions</span>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Cercar per nom, alias o ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-secondary/50 border-transparent focus:border-accent"
                        data-testid="search-input"
                    />
                </div>
            </div>

            {/* View List */}
            <ScrollArea className="sidebar-content">
                <div className="space-y-1">
                    {filteredViews.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            {searchQuery 
                                ? 'No s\'han trobat resultats' 
                                : 'No hi ha vistes carregades'}
                        </div>
                    ) : (
                        filteredViews.map(view => (
                            <div
                                key={view.id}
                                className={`view-list-item ${selectedView?.id === view.id ? 'selected' : ''}`}
                                onClick={() => handleViewClick(view)}
                                data-testid={`view-item-${view.view_id}`}
                            >
                                <div className="font-medium truncate">
                                    {view.display_name}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-muted-foreground font-mono">
                                        ID: {view.view_id}
                                    </span>
                                    {view.alias && view.alias !== view.name && (
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                                            alias
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};
