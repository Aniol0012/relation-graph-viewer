import React from "react";
import { useApp } from "../../context/AppContext";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  Database,
  Search,
  Box,
  GitBranch,
  X,
  Sparkles,
  Filter,
  Eye,
  EyeOff,
  Check,
  ExternalLink,
} from "lucide-react";

export const Sidebar = () => {
  const {
    views,
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
    foundPath,
    isNewView,
    newViews,
    newRelations,
    focusOnNode,
    filterMode,
    setFilterMode,
    hiddenViews,
    selectedForFilter,
    toggleViewForFilter,
    applyFilter,
    clearFilters,
  } = useApp();

  const handleViewClick = (view) => {
    if (filterMode) {
      toggleViewForFilter(view.view_id);
      return;
    }
    setSelectedView(view);
    setSelectedRelation(null);
    focusOnNode(view.id);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const getDisplayText = (view) => {
    const maxLen = settings.maxNodeNameLength;
    let name = view.alias || view.name || `View_${view.view_id}`;
    if (name.length > maxLen) {
      name = name.substring(0, maxLen - 2) + "..";
    }
    return name;
  };

  const handleStartFilterMode = () => {
    setFilterMode(true);
  };

  const handleCancelFilterMode = () => {
    setFilterMode(false);
  };

  return (
    <div className="sidebar" data-testid="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-accent/10">
            <Database className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="font-heading font-semibold text-lg">
              Relation Graph
            </h1>
            <p className="text-xs text-muted-foreground">Viewer</p>
          </div>
        </div>

        {/* Author info */}
        <a
          href="https://github.com/Aniol0012/relation-graph-viewer"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors mb-4"
        >
          <span>per Aniol0012</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        {/* Stats */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="stats-badge">
            <Box className="w-3 h-3" />
            <span>{stats.views_count} vistes</span>
          </div>
          <div className="stats-badge">
            <GitBranch className="w-3 h-3" />
            <span>{stats.relations_count} relacions</span>
          </div>
          {(newViews.length > 0 || newRelations.length > 0) && (
            <div className="stats-badge bg-amber-500/20 text-amber-500">
              <Sparkles className="w-3 h-3" />
              <span>{newViews.length + newRelations.length} nous</span>
            </div>
          )}
          {hiddenViews.size > 0 && (
            <div className="stats-badge bg-muted text-muted-foreground">
              <EyeOff className="w-3 h-3" />
              <span>{hiddenViews.size} ocultes</span>
            </div>
          )}
        </div>

        {/* Filter mode indicator */}
        {filterMode && (
          <div className="mb-4 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="text-xs font-medium text-blue-500 mb-2">
              Mode selecció de filtres
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              Selecciona les vistes que vols mostrar ({selectedForFilter.size}{" "}
              seleccionades)
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelFilterMode}
              >
                Cancel·lar
              </Button>
              <Button
                size="sm"
                onClick={applyFilter}
                disabled={selectedForFilter.size === 0}
              >
                <Check className="w-3 h-3 mr-1" />
                Aplicar
              </Button>
            </div>
          </div>
        )}

        {/* Pathfinding indicator */}
        {pathfindingMode && !filterMode && (
          <div className="mb-4 p-2 rounded-lg bg-accent/10 border border-accent/20">
            <div className="text-xs font-medium text-accent mb-1">
              Mode cerca de camí
            </div>
            <div className="text-xs text-muted-foreground">
              {!pathStart && "Clica una vista per marcar l'origen"}
              {pathStart &&
                !pathEnd &&
                "Clica una altra vista per marcar el destí"}
              {foundPath &&
                !foundPath.notFound &&
                `Camí: ${foundPath.nodes?.length} nodes`}
              {foundPath?.notFound && "No s'ha trobat cap camí"}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cercar per nom, alias o ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 bg-secondary/50 border-transparent focus:border-accent"
            data-testid="search-input"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={clearSearch}
              data-testid="clear-search-btn"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Filter buttons */}
        {!filterMode && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={handleStartFilterMode}
              data-testid="filter-mode-btn"
            >
              <Filter className="w-3 h-3 mr-1" />
              Filtrar
            </Button>
            {hiddenViews.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={clearFilters}
                data-testid="clear-filters-btn"
              >
                <Eye className="w-3 h-3 mr-1" />
                Mostrar tot
              </Button>
            )}
          </div>
        )}
      </div>

      {/* View List */}
      <ScrollArea className="sidebar-content">
        <div className="space-y-1">
          {(filterMode ? views : filteredViews).length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {searchQuery
                ? "No s'han trobat resultats"
                : "No hi ha vistes carregades"}
            </div>
          ) : (
            (filterMode ? views : filteredViews).map((view) => {
              const isInPath = foundPath?.nodes?.includes(view.id);
              const isPathStart = pathStart === view.id;
              const isPathEnd = pathEnd === view.id;
              const isNew = isNewView(view.view_id);
              const isHidden = hiddenViews.has(view.view_id);
              const isSelectedForFilter = selectedForFilter.has(view.view_id);

              return (
                <div
                  key={view.id}
                  className={`view-list-item ${selectedView?.id === view.id && !filterMode ? "selected" : ""} ${isInPath ? "path-item" : ""} ${filterMode && isSelectedForFilter ? "filter-selected" : ""}`}
                  onClick={() => handleViewClick(view)}
                  data-testid={`view-item-${view.view_id}`}
                  style={{
                    borderLeftColor: isNew
                      ? "#F59E0B"
                      : isInPath
                        ? "#10B981"
                        : isSelectedForFilter
                          ? "#3B82F6"
                          : undefined,
                    backgroundColor: isInPath
                      ? "rgba(16, 185, 129, 0.1)"
                      : isNew
                        ? "rgba(245, 158, 11, 0.05)"
                        : isSelectedForFilter
                          ? "rgba(59, 130, 246, 0.1)"
                          : undefined,
                    opacity: isHidden && !filterMode ? 0.5 : 1,
                  }}
                >
                  <div className="flex items-center gap-2">
                    {filterMode && (
                      <Checkbox
                        checked={isSelectedForFilter}
                        className="mr-1"
                      />
                    )}
                    <span className="font-medium truncate flex-1">
                      {getDisplayText(view)}
                    </span>
                    {isNew && !filterMode && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0 bg-amber-500/20 text-amber-500 border-amber-500/30"
                      >
                        NOU
                      </Badge>
                    )}
                    {isPathStart && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0 bg-green-500/20 text-green-500 border-green-500/30"
                      >
                        INICI
                      </Badge>
                    )}
                    {isPathEnd && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0 bg-blue-500/20 text-blue-500 border-blue-500/30"
                      >
                        FI
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground font-mono">
                      #{view.view_id}
                    </span>
                    {view.alias && view.alias !== view.name && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                      >
                        alias
                      </Badge>
                    )}
                  </div>
                  {settings.showAlias &&
                    view.alias &&
                    view.name !== view.alias && (
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
        <div className="text-xs font-medium mb-2 text-muted-foreground">
          Llegenda de JOINs
        </div>
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(settings.joinColors)
            .slice(0, 6)
            .map(([type, color]) => (
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
