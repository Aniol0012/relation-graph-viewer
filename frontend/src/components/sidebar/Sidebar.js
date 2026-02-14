import React from 'react';
import { useApp } from '../../context/AppContext';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Database, Search, Box, GitBranch } from 'lucide-react';

export const Sidebar = () => {
    const { 
        filteredViews, 
        searchQuery, 
        setSearchQuery,
        selectedView,
        setSelectedView,
        setSelectedRelation,
        stats,
        settings,
        pathfindingMode,
        pathStart,
        pathEnd,
        foundPath
    } = useApp();

    const handleViewClick = (view) => {
        setSelectedView(view);
        setSelectedRelation(null);
    };

    // Get display text for a view
    const getDisplayText = (view) => {
        const maxLen = settings.maxNodeNameLength;
        let name = view.alias || view.name || `View_${view.view_id}`;
        if (name.length > maxLen) {
            name = name.substring(0, maxLen - 2) + '..';
        }
        return name;
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

                {/* Pathfinding indicator */}
                {pathfindingMode && (
                    <div className="mb-4 p-2 rounded-lg bg-accent/10 border border-accent/20">
                        <div className="text-xs font-medium text-accent mb-1">Mode cerca de camí</div>
                        <div className="text-xs text-muted-foreground">
                            {!pathStart && 'Clica una vista per marcar l\'origen'}
                            {pathStart && !pathEnd && 'Clica una altra vista per marcar el destí'}
                            {foundPath && !foundPath.notFound && `Camí: ${foundPath.nodes?.length} nodes`}
                            {foundPath?.notFound && 'No s\'ha trobat cap camí'}
                        </div>
                    </div>
                )}

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
                        filteredViews.map(view => {
                            const isInPath = foundPath?.nodes?.includes(view.id);
                            const isPathStart = pathStart === view.id;
                            const isPathEnd = pathEnd === view.id;
                            
                            return (
                                <div
                                    key={view.id}
                                    className={`view-list-item ${selectedView?.id === view.id ? 'selected' : ''} ${isInPath ? 'path-item' : ''}`}
                                    onClick={() => handleViewClick(view)}
                                    data-testid={`view-item-${view.view_id}`}
                                    style={{
                                        borderLeftColor: isInPath ? '#10B981' : undefined,
                                        backgroundColor: isInPath ? 'rgba(16, 185, 129, 0.1)' : undefined
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium truncate flex-1">
                                            {getDisplayText(view)}
                                        </span>
                                        {isPathStart && (
                                            <Badge variant="outline" className="text-[10px] px-1 py-0 bg-green-500/20 text-green-500 border-green-500/30">
                                                INICI
                                            </Badge>
                                        )}
                                        {isPathEnd && (
                                            <Badge variant="outline" className="text-[10px] px-1 py-0 bg-blue-500/20 text-blue-500 border-blue-500/30">
                                                FI
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-muted-foreground font-mono">
                                            #{view.view_id}
                                        </span>
                                        {view.alias && view.alias !== view.name && (
                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                                alias
                                            </Badge>
                                        )}
                                    </div>
                                    {/* Show original name if using alias */}
                                    {settings.showAlias && view.alias && view.name !== view.alias && (
                                        <div className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">
                                            {view.name}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>

            {/* Color Legend */}
            <div className="p-3 border-t border-border">
                <div className="text-xs font-medium mb-2 text-muted-foreground">Llegenda de JOINs</div>
                <div className="grid grid-cols-2 gap-1">
                    {Object.entries(settings.joinColors).slice(0, 6).map(([type, color]) => (
                        <div key={type} className="flex items-center gap-1.5">
                            <div 
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: color }}
                            />
                            <span className="text-[10px] text-muted-foreground truncate">
                                {type}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
