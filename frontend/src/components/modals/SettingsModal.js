import React from 'react';
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

export const SettingsModal = ({ open, onOpenChange }) => {
    const { settings, updateSettings, resetSettings, defaultSettings } = useApp();

    const handleColorChange = (joinType, color) => {
        updateSettings({
            joinColors: {
                ...settings.joinColors,
                [joinType]: color
            }
        });
    };

    const handleReset = () => {
        resetSettings();
        toast.success('Configuració restablerta');
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
        <Dialog open={open} onOpenChange={onOpenChange}>
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

                    <ScrollArea className="flex-1 mt-4 pr-4" style={{ height: 'calc(85vh - 220px)' }}>
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
                                        checked={settings.showViewId}
                                        onCheckedChange={(checked) => updateSettings({ showViewId: checked })}
                                        data-testid="toggle-show-id"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Mostrar nom original</Label>
                                        <p className="text-xs text-muted-foreground">Mostra el nom sota l'alias</p>
                                    </div>
                                    <Switch
                                        checked={settings.showAlias}
                                        onCheckedChange={(checked) => updateSettings({ showAlias: checked })}
                                        data-testid="toggle-show-alias"
                                    />
                                </div>

                                <div>
                                    <Label>Longitud màxima del nom</Label>
                                    <p className="text-xs text-muted-foreground mb-2">Caràcters: {settings.maxNodeNameLength}</p>
                                    <Slider
                                        value={[settings.maxNodeNameLength]}
                                        onValueChange={([val]) => updateSettings({ maxNodeNameLength: val })}
                                        min={10}
                                        max={40}
                                        step={1}
                                        data-testid="slider-name-length"
                                    />
                                </div>

                                <div>
                                    <Label>Mida dels nodes</Label>
                                    <Select
                                        value={settings.nodeSize}
                                        onValueChange={(val) => updateSettings({ nodeSize: val })}
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
                                        checked={settings.showEdgeLabels}
                                        onCheckedChange={(checked) => updateSettings({ showEdgeLabels: checked })}
                                        data-testid="toggle-edge-labels"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Arestes animades</Label>
                                        <p className="text-xs text-muted-foreground">Animació de flux</p>
                                    </div>
                                    <Switch
                                        checked={settings.animatedEdges}
                                        onCheckedChange={(checked) => updateSettings({ animatedEdges: checked })}
                                        data-testid="toggle-animated-edges"
                                    />
                                </div>

                                <div>
                                    <Label>Estil de les arestes</Label>
                                    <Select
                                        value={settings.edgeStyle}
                                        onValueChange={(val) => updateSettings({ edgeStyle: val })}
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
                                        value={settings.theme}
                                        onValueChange={(val) => updateSettings({ theme: val })}
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
                                            style={{ backgroundColor: settings.joinColors[key] }}
                                        />
                                        <Label className="text-sm">{label}</Label>
                                    </div>
                                    <Input
                                        type="color"
                                        value={settings.joinColors[key]}
                                        onChange={(e) => handleColorChange(key, e.target.value)}
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
                                                style={{ backgroundColor: settings.joinColors[key] }}
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
                                    value={settings.layoutDirection}
                                    onValueChange={(val) => updateSettings({ layoutDirection: val })}
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
                                <p className="text-xs text-muted-foreground mb-2">{settings.nodeSpacing}px</p>
                                <Slider
                                    value={[settings.nodeSpacing]}
                                    onValueChange={([val]) => updateSettings({ nodeSpacing: val })}
                                    min={40}
                                    max={200}
                                    step={10}
                                    data-testid="slider-node-spacing"
                                />
                            </div>

                            <div>
                                <Label>Espaiat entre nivells</Label>
                                <p className="text-xs text-muted-foreground mb-2">{settings.levelSpacing}px</p>
                                <Slider
                                    value={[settings.levelSpacing]}
                                    onValueChange={([val]) => updateSettings({ levelSpacing: val })}
                                    min={60}
                                    max={300}
                                    step={10}
                                    data-testid="slider-level-spacing"
                                />
                            </div>
                        </TabsContent>
                    </ScrollArea>
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
                    <Button onClick={() => onOpenChange(false)} data-testid="close-settings-btn">
                        Tancar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
