import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useApp } from '../../context/AppContext';
import { Sparkles } from 'lucide-react';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
} from '../ui/context-menu';

export const CustomNode = memo(({ data, selected }) => {
    const { 
        settings, 
        pathfindingMode, 
        pathStart, 
        pathEnd, 
        foundPath,
        isNewView,
        connectionMode,
        setConnectionMode,
        connectionSource,
        setConnectionSource,
        setSelectedView,
        views
    } = useApp();
    
    const isPathNode = foundPath?.nodes?.includes(data.id);
    const isPathStart = pathStart === data.id;
    const isPathEnd = pathEnd === data.id;
    const isNew = isNewView(data.view_id);
    const isConnectionSource = connectionSource === data.id;
    
    // Determine node size
    const sizeClasses = {
        small: 'min-w-[100px] max-w-[140px] px-2 py-1.5 text-xs',
        medium: 'min-w-[140px] max-w-[180px] px-3 py-2 text-sm',
        large: 'min-w-[180px] max-w-[240px] px-4 py-3 text-base'
    };
    
    const sizeClass = sizeClasses[settings.nodeSize] || sizeClasses.medium;

    // Build display text
    const displayName = data.alias || data.name?.substring(0, settings.maxNodeNameLength) || `View_${data.view_id}`;
    const truncatedName = displayName.length > settings.maxNodeNameLength 
        ? displayName.substring(0, settings.maxNodeNameLength - 2) + '..'
        : displayName;

    const handleStartConnection = () => {
        setConnectionMode(true);
        setConnectionSource(data.id);
    };

    const handleViewDetails = () => {
        const view = views.find(v => v.id === data.id);
        if (view) {
            setSelectedView(view);
        }
    };

    // Determine border color
    let borderColor = 'transparent';
    if (isConnectionSource) {
        borderColor = '#F59E0B';
    } else if (isNew) {
        borderColor = '#F59E0B';
    } else if (isPathNode) {
        borderColor = '#10B981';
    } else if (selected) {
        borderColor = 'hsl(var(--accent))';
    }

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <div 
                    className={`
                        custom-node ${sizeClass}
                        ${selected ? 'selected' : ''}
                        ${isPathNode ? 'path-highlight' : ''}
                        ${isPathStart ? 'path-start' : ''}
                        ${isPathEnd ? 'path-end' : ''}
                        ${pathfindingMode ? 'pathfinding-mode' : ''}
                        ${connectionMode ? 'connection-mode' : ''}
                        ${isConnectionSource ? 'connection-source' : ''}
                    `}
                    style={{
                        borderColor: borderColor,
                        boxShadow: isPathNode 
                            ? '0 0 12px rgba(16, 185, 129, 0.5)' 
                            : (isConnectionSource ? '0 0 12px rgba(245, 158, 11, 0.5)' : undefined)
                    }}
                >
                    <Handle
                        type="target"
                        position={Position.Top}
                        className="node-handle-large"
                        isConnectable={true}
                    />
                    
                    {/* New badge */}
                    {isNew && (
                        <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center z-10">
                            <Sparkles className="w-2.5 h-2.5 text-white" />
                        </div>
                    )}
                    
                    {/* Main name */}
                    <div className="font-semibold truncate leading-tight" title={data.alias || data.name}>
                        {truncatedName}
                    </div>
                    
                    {/* ID badge */}
                    {settings.showViewId && (
                        <div className="flex items-center justify-center gap-1.5 mt-1">
                            <span className="node-id-badge">
                                #{data.view_id}
                            </span>
                            {isPathStart && (
                                <span className="path-badge start">INICI</span>
                            )}
                            {isPathEnd && (
                                <span className="path-badge end">FI</span>
                            )}
                        </div>
                    )}
                    
                    {/* Show original name if different from alias */}
                    {settings.showAlias && data.alias && data.name !== data.alias && (
                        <div className="text-[10px] text-muted-foreground mt-0.5 truncate opacity-70" title={data.name}>
                            {data.name?.substring(0, 25)}{data.name?.length > 25 ? '..' : ''}
                        </div>
                    )}
                    
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        className="node-handle-large"
                        isConnectable={true}
                    />
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={handleViewDetails} data-testid="ctx-view-details">
                    Veure detalls
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={handleStartConnection} data-testid="ctx-create-relation">
                    Crear relació des d'aquí
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
});

CustomNode.displayName = 'CustomNode';
