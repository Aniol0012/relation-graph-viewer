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
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const CreateViewModal = ({ open, onOpenChange }) => {
    const { createView } = useApp();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        view_id: '',
        name: '',
        name2: '',
        alias: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.view_id || !formData.name) {
            toast.error('View ID i Name són obligatoris');
            return;
        }

        setLoading(true);
        try {
            await createView({
                view_id: parseInt(formData.view_id),
                name: formData.name,
                name2: formData.name2 || null,
                alias: formData.alias || null
            });
            toast.success('Vista creada correctament');
            handleClose();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Error creant la vista');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({ view_id: '', name: '', name2: '', alias: '' });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-heading flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Crear Nova Vista
                    </DialogTitle>
                    <DialogDescription>
                        Afegeix una nova vista a l'estructura
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="view_id">View ID *</Label>
                        <Input
                            id="view_id"
                            type="number"
                            value={formData.view_id}
                            onChange={(e) => setFormData({...formData, view_id: e.target.value})}
                            placeholder="Ex: 1234"
                            className="mt-1"
                            required
                            data-testid="create-view-id-input"
                        />
                    </div>

                    <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="Ex: Shop"
                            className="mt-1"
                            required
                            data-testid="create-view-name-input"
                        />
                    </div>

                    <div>
                        <Label htmlFor="name2">Name2</Label>
                        <Input
                            id="name2"
                            value={formData.name2}
                            onChange={(e) => setFormData({...formData, name2: e.target.value})}
                            placeholder="Ex: DBCommon.Shop"
                            className="mt-1"
                            data-testid="create-view-name2-input"
                        />
                    </div>

                    <div>
                        <Label htmlFor="alias">Alias</Label>
                        <Input
                            id="alias"
                            value={formData.alias}
                            onChange={(e) => setFormData({...formData, alias: e.target.value})}
                            placeholder="Ex: Botiga"
                            className="mt-1"
                            data-testid="create-view-alias-input"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            L'alias es mostrarà al graf si està definit
                        </p>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={handleClose}
                            data-testid="cancel-create-view-btn"
                        >
                            Cancel·lar
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={loading}
                            data-testid="submit-create-view-btn"
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
