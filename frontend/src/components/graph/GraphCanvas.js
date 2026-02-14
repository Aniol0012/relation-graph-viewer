import React, { useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useApp } from '../../context/AppContext';
import { CustomNode } from './CustomNode';
import { Database } from 'lucide-react';

const nodeTypes = {
    custom: CustomNode
};

// Layout algorithm - arrange nodes in a grid-like pattern
const calculateLayout = (nodes, edges) => {
    if (nodes.length === 0) return [];

    // Create adjacency map
    const adjacency = new Map();
    nodes.forEach(n => adjacency.set(n.id, { in: [], out: [] }));
    
    edges.forEach(e => {
        if (adjacency.has(e.source)) {
            adjacency.get(e.source).out.push(e.target);
        }
        if (adjacency.has(e.target)) {
            adjacency.get(e.target).in.push(e.source);
        }
    });

    // Find root nodes (no incoming edges)
    const roots = nodes.filter(n => adjacency.get(n.id)?.in.length === 0);
    
    // BFS to assign levels
    const levels = new Map();
    const visited = new Set();
    const queue = roots.length > 0 ? [...roots] : [nodes[0]];
    
    queue.forEach(n => {
        levels.set(n.id, 0);
        visited.add(n.id);
    });

    while (queue.length > 0) {
        const node = queue.shift();
        const currentLevel = levels.get(node.id);
        const adj = adjacency.get(node.id);
        
        if (adj) {
            [...adj.out, ...adj.in].forEach(targetId => {
                if (!visited.has(targetId)) {
                    visited.add(targetId);
                    levels.set(targetId, currentLevel + 1);
                    const targetNode = nodes.find(n => n.id === targetId);
                    if (targetNode) queue.push(targetNode);
                }
            });
        }
    }

    // Handle disconnected nodes
    nodes.forEach(n => {
        if (!levels.has(n.id)) {
            levels.set(n.id, 0);
        }
    });

    // Group by level
    const levelGroups = new Map();
    nodes.forEach(n => {
        const level = levels.get(n.id);
        if (!levelGroups.has(level)) {
            levelGroups.set(level, []);
        }
        levelGroups.get(level).push(n);
    });

    // Position nodes
    const nodeWidth = 180;
    const nodeHeight = 80;
    const horizontalSpacing = 60;
    const verticalSpacing = 100;

    const positionedNodes = [];
    const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
    
    sortedLevels.forEach(level => {
        const levelNodes = levelGroups.get(level);
        const levelWidth = levelNodes.length * (nodeWidth + horizontalSpacing);
        const startX = -levelWidth / 2;

        levelNodes.forEach((node, idx) => {
            positionedNodes.push({
                ...node,
                position: {
                    x: startX + idx * (nodeWidth + horizontalSpacing),
                    y: level * (nodeHeight + verticalSpacing)
                }
            });
        });
    });

    return positionedNodes;
};

export const GraphCanvas = () => {
    const { 
        views, 
        relations, 
        selectedView, 
        setSelectedView,
        selectedRelation,
        setSelectedRelation,
        theme 
    } = useApp();

    // Transform data to React Flow format
    const initialNodes = useMemo(() => {
        return views.map(view => ({
            id: view.id,
            type: 'custom',
            data: {
                display_name: view.display_name,
                view_id: view.view_id,
                name: view.name,
                alias: view.alias
            },
            position: { x: 0, y: 0 }
        }));
    }, [views]);

    const initialEdges = useMemo(() => {
        return relations.map(rel => ({
            id: rel.id,
            source: rel.source,
            target: rel.target,
            data: rel,
            animated: false,
            style: { 
                stroke: 'hsl(var(--accent))',
                strokeWidth: 2
            },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: 'hsl(var(--accent))'
            },
            label: rel.relation?.split(' ')[1] || '',
            labelStyle: {
                fontSize: 10,
                fill: 'hsl(var(--muted-foreground))'
            },
            labelBgStyle: {
                fill: 'hsl(var(--background))',
                fillOpacity: 0.8
            }
        }));
    }, [relations]);

    // Apply layout
    const layoutedNodes = useMemo(() => {
        return calculateLayout(initialNodes, initialEdges);
    }, [initialNodes, initialEdges]);

    const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Update nodes when data changes
    useEffect(() => {
        setNodes(layoutedNodes);
        setEdges(initialEdges);
    }, [layoutedNodes, initialEdges, setNodes, setEdges]);

    // Handle node click
    const onNodeClick = useCallback((event, node) => {
        const view = views.find(v => v.id === node.id);
        if (view) {
            setSelectedView(view);
            setSelectedRelation(null);
        }
    }, [views, setSelectedView, setSelectedRelation]);

    // Handle edge click
    const onEdgeClick = useCallback((event, edge) => {
        const relation = relations.find(r => r.id === edge.id);
        if (relation) {
            setSelectedRelation(relation);
            setSelectedView(null);
        }
    }, [relations, setSelectedRelation, setSelectedView]);

    // Handle background click
    const onPaneClick = useCallback(() => {
        setSelectedView(null);
        setSelectedRelation(null);
    }, [setSelectedView, setSelectedRelation]);

    // Empty state
    if (views.length === 0) {
        return (
            <div className="empty-state">
                <Database className="w-16 h-16 mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-heading font-semibold mb-2">
                    No hi ha vistes carregades
                </h3>
                <p className="text-muted-foreground max-w-md">
                    Importa les teves vistes i relacions enganxant els INSERTs SQL 
                    utilitzant el botó "Importar SQL" de la barra d'eines.
                </p>
            </div>
        );
    }

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
            maxZoom={2}
            defaultEdgeOptions={{
                type: 'smoothstep'
            }}
        >
            <Background 
                color={theme === 'dark' ? '#27272a' : '#e4e4e7'} 
                gap={20} 
                size={1}
            />
            <Controls 
                showInteractive={false}
                position="bottom-left"
            />
            <MiniMap 
                nodeColor={theme === 'dark' ? '#3f3f46' : '#d4d4d8'}
                maskColor={theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)'}
                position="bottom-right"
                pannable
                zoomable
            />
        </ReactFlow>
    );
};
