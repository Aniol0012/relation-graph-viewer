import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { GitBranch, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const CreateRelationModal = ({ open, onOpenChange }) => {
    const { createRelation, views } = useApp();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        id_view1: '',
        id_view2: '',
        relation: '',
        relation2: '',
        edge_weight: '10'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.id_view1 || !formData.id_view2 || !formData.relation) {
            toast.error('Origen, Destí i Relació són obligatoris');
            return;
        }

        setLoading(true);
        try {
            await createRelation({
                id_view1: parseInt(formData.id_view1),
                id_view2: parseInt(formData.id_view2),
                relation: formData.relation,
                relation2: formData.relation2 || null,
                edge_weight: parseInt(formData.edge_weight) || 10
            });
            toast.success('Relació creada correctament');
            handleClose();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Error creant la relació');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({ id_view1: '', id_view2: '', relation: '', relation2: '', edge_weight: '10' });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-heading flex items-center gap-2">
                        <GitBranch className="w-5 h-5" />
                        Crear Nova Relació
                    </DialogTitle>
                    <DialogDescription>
                        Connecta dues vistes amb una relació SQL
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="id_view1">Vista Origen *</Label>
                            <Select
                                value={formData.id_view1}
                                onValueChange={(value) => setFormData({...formData, id_view1: value})}
                            >
                                <SelectTrigger className="mt-1" data-testid="select-view1">
                                    <SelectValue placeholder="Selecciona..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {views.map(view => (
                                        <SelectItem key={view.view_id} value={String(view.view_id)}>
                                            {view.display_name} ({view.view_id})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="id_view2">Vista Destí *</Label>
                            <Select
                                value={formData.id_view2}
                                onValueChange={(value) => setFormData({...formData, id_view2: value})}
                            >
                                <SelectTrigger className="mt-1" data-testid="select-view2">
                                    <SelectValue placeholder="Selecciona..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {views.map(view => (
                                        <SelectItem key={view.view_id} value={String(view.view_id)}>
                                            {view.display_name} ({view.view_id})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="relation">Relation (SQL) *</Label>
                        <Textarea
                            id="relation"
                            value={formData.relation}
                            onChange={(e) => setFormData({...formData, relation: e.target.value})}
                            placeholder="LEFT JOIN TableName ON TableName.Column = OtherTable.Column"
                            className="mt-1 font-mono text-sm"
                            rows={3}
                            required
                            data-testid="create-relation-sql-input"
                        />
                    </div>

                    <div>
                        <Label htmlFor="relation2">Relation2 (SQL alternativa)</Label>
                        <Textarea
                            id="relation2"
                            value={formData.relation2}
                            onChange={(e) => setFormData({...formData, relation2: e.target.value})}
                            placeholder="Opcional: versió alternativa amb schema complet"
                            className="mt-1 font-mono text-sm"
                            rows={2}
                            data-testid="create-relation2-sql-input"
                        />
                    </div>

                    <div>
                        <Label htmlFor="edge_weight">Edge Weight</Label>
                        <Input
                            id="edge_weight"
                            type="number"
                            value={formData.edge_weight}
                            onChange={(e) => setFormData({...formData, edge_weight: e.target.value})}
                            className="mt-1 w-32"
                            data-testid="create-relation-weight-input"
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={handleClose}
                            data-testid="cancel-create-relation-btn"
                        >
                            Cancel·lar
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={loading}
                            data-testid="submit-create-relation-btn"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                'Crear'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
