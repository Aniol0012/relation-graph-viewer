import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useApp } from '../../context/AppContext';

export const CustomNode = memo(({ data, selected }) => {
    const { settings, pathfindingMode, pathStart, pathEnd, foundPath } = useApp();
    
    const isPathNode = foundPath?.nodes?.includes(data.id);
    const isPathStart = pathStart === data.id;
    const isPathEnd = pathEnd === data.id;
    
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

    return (
        <div 
            className={`
                custom-node ${sizeClass}
                ${selected ? 'selected' : ''}
                ${isPathNode ? 'path-highlight' : ''}
                ${isPathStart ? 'path-start' : ''}
                ${isPathEnd ? 'path-end' : ''}
                ${pathfindingMode ? 'pathfinding-mode' : ''}
            `}
            style={{
                borderColor: isPathNode ? '#10B981' : (selected ? 'hsl(var(--accent))' : 'transparent'),
                boxShadow: isPathNode 
                    ? '0 0 12px rgba(16, 185, 129, 0.5)' 
                    : (selected ? '0 0 0 2px hsl(var(--accent) / 0.3)' : undefined)
            }}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="node-handle"
            />
            
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
                className="node-handle"
            />
        </div>
    );
});

CustomNode.displayName = 'CustomNode';
