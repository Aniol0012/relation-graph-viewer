import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
    X, 
    Edit2, 
    Trash2, 
    Save, 
    Box, 
    GitBranch,
    ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

export const DetailsPanel = () => {
    const {
        selectedView,
        setSelectedView,
        selectedRelation,
        setSelectedRelation,
        updateView,
        deleteView,
        updateRelation,
        deleteRelation,
        views,
        getJoinType,
        getJoinColor,
        settings
    } = useApp();

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});

    const handleClose = () => {
        setSelectedView(null);
        setSelectedRelation(null);
        setIsEditing(false);
    };

    const handleEdit = () => {
        if (selectedView) {
            setEditData({
                name: selectedView.name || '',
                name2: selectedView.name2 || '',
                alias: selectedView.alias || ''
            });
        } else if (selectedRelation) {
            setEditData({
                relation: selectedRelation.relation || '',
                relation2: selectedRelation.relation2 || '',
                edge_weight: selectedRelation.edge_weight || 10
            });
        }
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            if (selectedView) {
                await updateView(selectedView.view_id, editData);
                toast.success('Vista actualitzada correctament');
            } else if (selectedRelation) {
                await updateRelation(selectedRelation.id, editData);
                toast.success('Relació actualitzada correctament');
            }
            setIsEditing(false);
        } catch (err) {
            toast.error('Error actualitzant');
        }
    };

    const handleDelete = async () => {
        try {
            if (selectedView) {
                await deleteView(selectedView.view_id);
                toast.success('Vista eliminada correctament');
            } else if (selectedRelation) {
                await deleteRelation(selectedRelation.id);
                toast.success('Relació eliminada correctament');
            }
        } catch (err) {
            toast.error('Error eliminant');
        }
    };

    if (!selectedView && !selectedRelation) return null;

    // Find related views for relation
    const sourceView = selectedRelation 
        ? views.find(v => v.id === selectedRelation.source)
        : null;
    const targetView = selectedRelation 
        ? views.find(v => v.id === selectedRelation.target)
        : null;

    // Get join info
    const joinType = selectedRelation ? getJoinType(selectedRelation.relation) : null;
    const joinColor = selectedRelation ? getJoinColor(selectedRelation.relation) : null;

    return (
        <div className="details-panel animate-slide-in-right" data-testid="details-panel">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                    {selectedView ? (
                        <Box className="w-5 h-5 text-accent" />
                    ) : (
                        <GitBranch className="w-5 h-5" style={{ color: joinColor }} />
                    )}
                    <h2 className="font-heading font-semibold">
                        {selectedView ? 'Detalls de Vista' : 'Detalls de Relació'}
                    </h2>
                    {joinType && (
                        <Badge 
                            variant="outline" 
                            className="ml-2 text-xs"
                            style={{ 
                                borderColor: joinColor,
                                color: joinColor
                            }}
                        >
                            {joinType}
                        </Badge>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    data-testid="close-details-btn"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {selectedView && (
                    <>
                        {/* View ID */}
                        <div>
                            <Label className="text-muted-foreground">View ID</Label>
                            <div className="font-mono text-2xl font-bold mt-1 text-accent">
                                #{selectedView.view_id}
                            </div>
                        </div>

                        {isEditing ? (
                            <>
                                <div>
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={editData.name}
                                        onChange={(e) => setEditData({...editData, name: e.target.value})}
                                        className="mt-1 font-mono"
                                        data-testid="edit-name-input"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="name2">Name2</Label>
                                    <Input
                                        id="name2"
                                        value={editData.name2}
                                        onChange={(e) => setEditData({...editData, name2: e.target.value})}
                                        className="mt-1 font-mono"
                                        data-testid="edit-name2-input"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="alias">Alias</Label>
                                    <Input
                                        id="alias"
                                        value={editData.alias}
                                        onChange={(e) => setEditData({...editData, alias: e.target.value})}
                                        className="mt-1"
                                        data-testid="edit-alias-input"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        L'alias es mostra al graf si està definit
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-3 rounded-lg bg-secondary/50">
                                    <Label className="text-muted-foreground text-xs">Nom mostrat</Label>
                                    <div className="font-semibold text-lg mt-1">
                                        {selectedView.alias || selectedView.name || '-'}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Name (DB)</Label>
                                    <div className="font-mono mt-1 text-sm">{selectedView.name || '-'}</div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Name2</Label>
                                    <div className="font-mono mt-1 text-sm">{selectedView.name2 || '-'}</div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Alias</Label>
                                    <div className="mt-1">{selectedView.alias || '-'}</div>
                                </div>
                            </>
                        )}
                    </>
                )}

                {selectedRelation && (
                    <>
                        {/* Source -> Target */}
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
                            <div className="flex-1 text-center">
                                <div className="text-xs text-muted-foreground mb-1">Origen</div>
                                <div className="font-semibold truncate">
                                    {sourceView?.alias || sourceView?.name || selectedRelation.source}
                                </div>
                                <div className="text-xs font-mono text-muted-foreground">
                                    #{sourceView?.view_id}
                                </div>
                            </div>
                            <div className="flex flex-col items-center">
                                <ArrowRight className="w-5 h-5" style={{ color: joinColor }} />
                                <Badge 
                                    variant="outline" 
                                    className="text-[10px] mt-1"
                                    style={{ borderColor: joinColor, color: joinColor }}
                                >
                                    {joinType}
                                </Badge>
                            </div>
                            <div className="flex-1 text-center">
                                <div className="text-xs text-muted-foreground mb-1">Destí</div>
                                <div className="font-semibold truncate">
                                    {targetView?.alias || targetView?.name || selectedRelation.target}
                                </div>
                                <div className="text-xs font-mono text-muted-foreground">
                                    #{targetView?.view_id}
                                </div>
                            </div>
                        </div>

                        {isEditing ? (
                            <>
                                <div>
                                    <Label htmlFor="relation">Relation (SQL)</Label>
                                    <Textarea
                                        id="relation"
                                        value={editData.relation}
                                        onChange={(e) => setEditData({...editData, relation: e.target.value})}
                                        className="mt-1 font-mono text-sm"
                                        rows={4}
                                        data-testid="edit-relation-input"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="relation2">Relation2 (SQL alternativa)</Label>
                                    <Textarea
                                        id="relation2"
                                        value={editData.relation2 || ''}
                                        onChange={(e) => setEditData({...editData, relation2: e.target.value})}
                                        className="mt-1 font-mono text-sm"
                                        rows={3}
                                        data-testid="edit-relation2-input"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edge_weight">Edge Weight</Label>
                                    <Input
                                        id="edge_weight"
                                        type="number"
                                        value={editData.edge_weight}
                                        onChange={(e) => setEditData({...editData, edge_weight: parseInt(e.target.value) || 10})}
                                        className="mt-1 w-24"
                                        data-testid="edit-weight-input"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <Label className="text-muted-foreground">Relation (SQL)</Label>
                                    <div className="sql-code mt-1">
                                        {selectedRelation.relation || '-'}
                                    </div>
                                </div>
                                {selectedRelation.relation2 && (
                                    <div>
                                        <Label className="text-muted-foreground">Relation2 (SQL alternativa)</Label>
                                        <div className="sql-code mt-1">
                                            {selectedRelation.relation2}
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">Edge Weight</Label>
                                        <div className="mt-1 font-mono">{selectedRelation.edge_weight || 10}</div>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background/95 backdrop-blur">
                {isEditing ? (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setIsEditing(false)}
                            data-testid="cancel-edit-btn"
                        >
                            Cancel·lar
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleSave}
                            data-testid="save-edit-btn"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Guardar
                        </Button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleEdit}
                            data-testid="edit-btn"
                        >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Editar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            data-testid="delete-btn"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
