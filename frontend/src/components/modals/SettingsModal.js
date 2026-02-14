import React, { useState, useEffect } from 'react';
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
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Settings, Palette, Layout, Eye, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

// Suppress ResizeObserver errors
if (typeof window !== 'undefined') {
    const resizeObserverErr = window.onerror;
    window.onerror = function(msg, url, line, col, error) {
        if (msg && msg.toString().includes('ResizeObserver')) {
            return true;
        }
        if (resizeObserverErr) {
            return resizeObserverErr(msg, url, line, col, error);
        }
        return false;
    };
}

export const SettingsModal = ({ open, onOpenChange }) => {
    const { settings, updateSettings, resetSettings, defaultSettings } = useApp();
    
    // Use local state to batch updates
    const [localSettings, setLocalSettings] = useState({ ...settings });

    // Sync when modal opens
    useEffect(() => {
        if (open) {
            setLocalSettings({ ...settings });
        }
    }, [open, settings]);

    const handleLocalChange = (key, value) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleColorChange = (joinType, color) => {
        setLocalSettings(prev => ({
            ...prev,
            joinColors: { ...prev.joinColors, [joinType]: color }
        }));
    };

    // Apply changes when closing or explicitly
    const applyChanges = () => {
        updateSettings(localSettings);
    };

    const handleClose = () => {
        applyChanges();
        onOpenChange(false);
    };

    const handleReset = () => {
        setLocalSettings({ ...defaultSettings });
        resetSettings();
        toast.success('Configuració restablerta');
    };

    // Debounced apply for sliders
    useEffect(() => {
        const timer = setTimeout(() => {
            if (open) {
                updateSettings(localSettings);
            }
        }, 200);
        return () => clearTimeout(timer);
    }, [localSettings.nodeSpacing, localSettings.levelSpacing, localSettings.maxNodeNameLength]);

    // Immediate apply for toggles and selects
    const handleImmediateChange = (key, value) => {
        handleLocalChange(key, value);
        updateSettings({ [key]: value });
    };

    const handleImmediateColorChange = (joinType, color) => {
        handleColorChange(joinType, color);
        updateSettings({ joinColors: { ...localSettings.joinColors, [joinType]: color } });
    };

    const joinTypes = [
        { key: 'LEFT JOIN', label: 'LEFT JOIN' },
        { key: 'RIGHT JOIN', label: 'RIGHT JOIN' },
        { key: 'INNER JOIN', label: 'INNER JOIN' },
        { key: 'CROSS JOIN', label: 'CROSS JOIN' },
        { key: 'FULL JOIN', label: 'FULL JOIN' },
        { key: 'JOIN', label: 'JOIN (Simple)' },
        { key: 'DEFAULT', label: 'Altres' }
    ];

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="font-heading flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Configuració
                    </DialogTitle>
                    <DialogDescription>
                        Personalitza l'aparença i comportament de l'aplicació
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="display" className="flex-1 overflow-hidden">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="display" className="text-xs">
                            <Eye className="w-3 h-3 mr-1" />
                            Visualització
                        </TabsTrigger>
                        <TabsTrigger value="colors" className="text-xs">
                            <Palette className="w-3 h-3 mr-1" />
                            Colors
                        </TabsTrigger>
                        <TabsTrigger value="layout" className="text-xs">
                            <Layout className="w-3 h-3 mr-1" />
                            Disseny
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 mt-4 overflow-y-auto pr-2" style={{ maxHeight: 'calc(85vh - 220px)' }}>
                        {/* Display Settings */}
                        <TabsContent value="display" className="space-y-6 mt-0">
                            <div className="space-y-4">
                                <h4 className="font-medium text-sm">Nodes</h4>
                                
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Mostrar ID</Label>
                                        <p className="text-xs text-muted-foreground">Mostra l'ID de la vista al node</p>
                                    </div>
                                    <Switch
                                        checked={localSettings.showViewId}
                                        onCheckedChange={(checked) => handleImmediateChange('showViewId', checked)}
                                        data-testid="toggle-show-id"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Mostrar nom original</Label>
                                        <p className="text-xs text-muted-foreground">Mostra el nom sota l'alias</p>
                                    </div>
                                    <Switch
                                        checked={localSettings.showAlias}
                                        onCheckedChange={(checked) => handleImmediateChange('showAlias', checked)}
                                        data-testid="toggle-show-alias"
                                    />
                                </div>

                                <div>
                                    <Label>Longitud màxima del nom</Label>
                                    <p className="text-xs text-muted-foreground mb-2">Caràcters: {localSettings.maxNodeNameLength}</p>
                                    <Slider
                                        value={[localSettings.maxNodeNameLength]}
                                        onValueChange={([val]) => handleLocalChange('maxNodeNameLength', val)}
                                        min={10}
                                        max={40}
                                        step={1}
                                        data-testid="slider-name-length"
                                    />
                                </div>

                                <div>
                                    <Label>Mida dels nodes</Label>
                                    <Select
                                        value={localSettings.nodeSize}
                                        onValueChange={(val) => handleImmediateChange('nodeSize', val)}
                                    >
                                        <SelectTrigger className="mt-1" data-testid="select-node-size">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="small">Petit</SelectItem>
                                            <SelectItem value="medium">Mitjà</SelectItem>
                                            <SelectItem value="large">Gran</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <h4 className="font-medium text-sm">Arestes (Relacions)</h4>
                                
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Mostrar tipus de JOIN</Label>
                                        <p className="text-xs text-muted-foreground">Etiqueta a les arestes</p>
                                    </div>
                                    <Switch
                                        checked={localSettings.showEdgeLabels}
                                        onCheckedChange={(checked) => handleImmediateChange('showEdgeLabels', checked)}
                                        data-testid="toggle-edge-labels"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Arestes animades</Label>
                                        <p className="text-xs text-muted-foreground">Animació de flux</p>
                                    </div>
                                    <Switch
                                        checked={localSettings.animatedEdges}
                                        onCheckedChange={(checked) => handleImmediateChange('animatedEdges', checked)}
                                        data-testid="toggle-animated-edges"
                                    />
                                </div>

                                <div>
                                    <Label>Estil de les arestes</Label>
                                    <Select
                                        value={localSettings.edgeStyle}
                                        onValueChange={(val) => handleImmediateChange('edgeStyle', val)}
                                    >
                                        <SelectTrigger className="mt-1" data-testid="select-edge-style">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="smoothstep">Suau (Smoothstep)</SelectItem>
                                            <SelectItem value="bezier">Corba (Bezier)</SelectItem>
                                            <SelectItem value="straight">Recta</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <h4 className="font-medium text-sm">Tema</h4>
                                
                                <div>
                                    <Label>Mode de color</Label>
                                    <Select
                                        value={localSettings.theme}
                                        onValueChange={(val) => handleImmediateChange('theme', val)}
                                    >
                                        <SelectTrigger className="mt-1" data-testid="select-theme">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="dark">Fosc</SelectItem>
                                            <SelectItem value="light">Clar</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Colors Settings */}
                        <TabsContent value="colors" className="space-y-4 mt-0">
                            <p className="text-sm text-muted-foreground">
                                Personalitza els colors de cada tipus de JOIN
                            </p>

                            {joinTypes.map(({ key, label }) => (
                                <div key={key} className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="w-4 h-4 rounded-full border"
                                            style={{ backgroundColor: localSettings.joinColors?.[key] || '#71717A' }}
                                        />
                                        <Label className="text-sm">{label}</Label>
                                    </div>
                                    <Input
                                        type="color"
                                        value={localSettings.joinColors?.[key] || '#71717A'}
                                        onChange={(e) => handleImmediateColorChange(key, e.target.value)}
                                        className="w-16 h-8 p-1 cursor-pointer"
                                        data-testid={`color-${key.replace(' ', '-').toLowerCase()}`}
                                    />
                                </div>
                            ))}

                            <div className="pt-4 border-t">
                                <h4 className="font-medium text-sm mb-3">Llegenda de colors</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {joinTypes.map(({ key, label }) => (
                                        <div key={key} className="flex items-center gap-2 text-xs">
                                            <div 
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: localSettings.joinColors?.[key] || '#71717A' }}
                                            />
                                            <span className="text-muted-foreground">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Layout Settings */}
                        <TabsContent value="layout" className="space-y-6 mt-0">
                            <div>
                                <Label>Direcció del layout</Label>
                                <p className="text-xs text-muted-foreground mb-2">Com s'organitzen els nodes</p>
                                <Select
                                    value={localSettings.layoutDirection}
                                    onValueChange={(val) => handleImmediateChange('layoutDirection', val)}
                                >
                                    <SelectTrigger data-testid="select-layout-direction">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TB">Dalt a Baix (Vertical)</SelectItem>
                                        <SelectItem value="LR">Esquerra a Dreta (Horitzontal)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Espaiat entre nodes</Label>
                                <p className="text-xs text-muted-foreground mb-2">{localSettings.nodeSpacing}px</p>
                                <Slider
                                    value={[localSettings.nodeSpacing]}
                                    onValueChange={([val]) => handleLocalChange('nodeSpacing', val)}
                                    min={40}
                                    max={200}
                                    step={10}
                                    data-testid="slider-node-spacing"
                                />
                            </div>

                            <div>
                                <Label>Espaiat entre nivells</Label>
                                <p className="text-xs text-muted-foreground mb-2">{localSettings.levelSpacing}px</p>
                                <Slider
                                    value={[localSettings.levelSpacing]}
                                    onValueChange={([val]) => handleLocalChange('levelSpacing', val)}
                                    min={60}
                                    max={300}
                                    step={10}
                                    data-testid="slider-level-spacing"
                                />
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>

                {/* Footer */}
                <div className="flex gap-2 pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        className="flex items-center gap-2"
                        data-testid="reset-settings-btn"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Restablir
                    </Button>
                    <div className="flex-1" />
                    <Button onClick={handleClose} data-testid="close-settings-btn">
                        Tancar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
