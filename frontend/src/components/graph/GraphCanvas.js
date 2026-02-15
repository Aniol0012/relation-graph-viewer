import React, { useCallback, useMemo, useEffect, useState } from 'react';
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
import { CreateRelationFromNodeModal } from '../modals/CreateRelationFromNodeModal';
import { Database } from 'lucide-react';
import { toast } from 'sonner';

const nodeTypes = {
    custom: CustomNode
};

// Layout algorithm with direction support
const calculateLayout = (nodes, edges, direction = 'TB', nodeSpacing = 80, levelSpacing = 120) => {
    if (nodes.length === 0) return [];

    const isHorizontal = direction === 'LR';
    
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
    const nodeHeight = 70;

    const positionedNodes = [];
    const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
    
    sortedLevels.forEach(level => {
        const levelNodes = levelGroups.get(level);
        
        if (isHorizontal) {
            const levelHeight = levelNodes.length * (nodeHeight + nodeSpacing);
            const startY = -levelHeight / 2;

            levelNodes.forEach((node, idx) => {
                positionedNodes.push({
                    ...node,
                    position: {
                        x: level * (nodeWidth + levelSpacing),
                        y: startY + idx * (nodeHeight + nodeSpacing)
                    }
                });
            });
        } else {
            const levelWidth = levelNodes.length * (nodeWidth + nodeSpacing);
            const startX = -levelWidth / 2;

            levelNodes.forEach((node, idx) => {
                positionedNodes.push({
                    ...node,
                    position: {
                        x: startX + idx * (nodeWidth + nodeSpacing),
                        y: level * (nodeHeight + levelSpacing)
                    }
                });
            });
        }
    });

    return positionedNodes;
};

export const GraphCanvas = () => {
    const { 
        visibleViews,
        visibleRelations,
        views,
        setSelectedView,
        setSelectedRelation,
        settings,
        getJoinType,
        getJoinColor,
        isNewRelation,
        pathfindingMode,
        setPathStart,
        setPathEnd,
        pathStart,
        pathEnd,
        foundPath,
        findPath,
        connectionMode,
        connectionSource,
        setConnectionMode,
        setConnectionSource,
        clearConnectionMode,
        reactFlowInstance
    } = useApp();

    const [createRelationModal, setCreateRelationModal] = useState(false);
    const [relationTargetId, setRelationTargetId] = useState(null);

    // Transform data to React Flow format
    const initialNodes = useMemo(() => {
        return visibleViews.map(view => ({
            id: view.id,
            type: 'custom',
            data: {
                id: view.id,
                display_name: view.display_name,
                view_id: view.view_id,
                name: view.name,
                alias: view.alias
            },
            position: { x: 0, y: 0 }
        }));
    }, [visibleViews]);

    const initialEdges = useMemo(() => {
        return visibleRelations.map(rel => {
            const joinType = getJoinType(rel.relation);
            const color = getJoinColor(rel.relation);
            const isInPath = foundPath?.edges?.includes(rel.id);
            const isNew = isNewRelation(rel.id);
            
            return {
                id: rel.id,
                source: rel.source,
                target: rel.target,
                data: rel,
                animated: settings.animatedEdges || isInPath,
                type: settings.edgeStyle,
                style: { 
                    stroke: isInPath ? '#10B981' : color,
                    strokeWidth: isInPath ? 3 : 2,
                    strokeDasharray: isNew ? '5,5' : undefined
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: isInPath ? '#10B981' : color,
                    width: 20,
                    height: 20
                },
                label: settings.showEdgeLabels ? joinType : '',
                labelStyle: {
                    fontSize: 9,
                    fontWeight: 600,
                    fill: isInPath ? '#10B981' : color,
                    textTransform: 'uppercase'
                },
                labelBgStyle: {
                    fill: 'hsl(var(--background))',
                    fillOpacity: 0.9
                },
                labelBgPadding: [4, 2]
            };
        });
    }, [visibleRelations, settings, getJoinType, getJoinColor, foundPath, isNewRelation]);

    // Apply layout
    const layoutedNodes = useMemo(() => {
        return calculateLayout(
            initialNodes, 
            initialEdges,
            settings.layoutDirection,
            settings.nodeSpacing,
            settings.levelSpacing
        );
    }, [initialNodes, initialEdges, settings.layoutDirection, settings.nodeSpacing, settings.levelSpacing]);

    const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Update nodes when data changes
    useEffect(() => {
        setNodes(layoutedNodes);
        setEdges(initialEdges);
    }, [layoutedNodes, initialEdges, setNodes, setEdges]);

    // Handle node click
    const onNodeClick = useCallback((event, node) => {
        if (connectionMode && connectionSource && node.id !== connectionSource) {
            setRelationTargetId(node.id);
            setCreateRelationModal(true);
            return;
        }
        
        if (pathfindingMode) {
            if (!pathStart) {
                setPathStart(node.id);
                toast.info('Selecciona la vista de destí');
            } else if (!pathEnd && node.id !== pathStart) {
                setPathEnd(node.id);
                findPath(pathStart, node.id);
            }
            return;
        }
        
        const view = views.find(v => v.id === node.id);
        if (view) {
            setSelectedView(view);
            setSelectedRelation(null);
        }
    }, [views, setSelectedView, setSelectedRelation, pathfindingMode, pathStart, pathEnd, setPathStart, setPathEnd, findPath, connectionMode, connectionSource]);

    // Handle connect (edge creation via drag from handle)
    const onConnect = useCallback((params) => {
        if (params.source && params.target && params.source !== params.target) {
            setConnectionSource(params.source);
            setRelationTargetId(params.target);
            setConnectionMode(true);
            setCreateRelationModal(true);
        }
    }, [setConnectionSource, setConnectionMode]);

    // Handle edge click
    const onEdgeClick = useCallback((event, edge) => {
        if (pathfindingMode || connectionMode) return;
        
        const relation = visibleRelations.find(r => r.id === edge.id);
        if (relation) {
            setSelectedRelation(relation);
            setSelectedView(null);
        }
    }, [visibleRelations, setSelectedRelation, setSelectedView, pathfindingMode, connectionMode]);

    // Store React Flow instance
    const onInit = useCallback((instance) => {
        reactFlowInstance.current = instance;
    }, [reactFlowInstance]);

    // Handle background click
    const onPaneClick = useCallback(() => {
        if (connectionMode) {
            clearConnectionMode();
            toast.info('Mode de connexió cancel·lat');
            return;
        }
        if (!pathfindingMode) {
            setSelectedView(null);
            setSelectedRelation(null);
        }
    }, [setSelectedView, setSelectedRelation, pathfindingMode, connectionMode, clearConnectionMode]);



    // Empty state
    if (visibleViews.length === 0) {
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
        <>
            {connectionMode && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-500 text-sm font-medium">
                    Arrossega sobre una altra vista o clica-la per crear la relació
                </div>
            )}
            
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onPaneClick={onPaneClick}
                onInit={onInit}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.05}
                maxZoom={2}
                connectOnClick={false}
                defaultEdgeOptions={{
                    type: settings.edgeStyle
                }}
            >
                <Background 
                    color={settings.theme === 'dark' ? '#27272a' : '#e4e4e7'} 
                    gap={20} 
                    size={1}
                />
                <Controls 
                    showInteractive={false}
                    position="bottom-left"
                />
                <MiniMap 
                    nodeColor={(node) => {
                        if (foundPath?.nodes?.includes(node.id)) return '#10B981';
                        return settings.theme === 'dark' ? '#3f3f46' : '#d4d4d8';
                    }}
                    maskColor={settings.theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)'}
                    position="bottom-right"
                    pannable
                    zoomable
                />
            </ReactFlow>

            <CreateRelationFromNodeModal
                open={createRelationModal}
                onOpenChange={(open) => {
                    setCreateRelationModal(open);
                    if (!open) {
                        clearConnectionMode();
                        setRelationTargetId(null);
                    }
                }}
                sourceId={connectionSource}
                targetId={relationTargetId}
            />
        </>
    );
};
