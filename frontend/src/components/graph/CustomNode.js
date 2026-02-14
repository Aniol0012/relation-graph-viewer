import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

export const CustomNode = memo(({ data, selected }) => {
    return (
        <div className={`custom-node ${selected ? 'selected' : ''}`}>
            <Handle
                type="target"
                position={Position.Top}
                style={{
                    background: 'hsl(var(--accent))',
                    width: 8,
                    height: 8,
                    border: 'none'
                }}
            />
            <div className="font-medium truncate" title={data.display_name}>
                {data.display_name}
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-mono">
                ID: {data.view_id}
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                style={{
                    background: 'hsl(var(--accent))',
                    width: 8,
                    height: 8,
                    border: 'none'
                }}
            />
        </div>
    );
});

CustomNode.displayName = 'CustomNode';
