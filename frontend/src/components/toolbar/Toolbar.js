import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../ui/alert-dialog';
import { 
    Upload, 
    Plus, 
    GitBranch, 
    Trash2, 
    Sun, 
    Moon,
    RefreshCw,
    Settings,
    Route,
    X
} from 'lucide-react';
import { SqlImportModal } from '../modals/SqlImportModal';
import { CreateViewModal } from '../modals/CreateViewModal';
import { CreateRelationModal } from '../modals/CreateRelationModal';
import { SettingsModal } from '../modals/SettingsModal';
import { toast } from 'sonner';

export const Toolbar = () => {
    const { 
        settings,
        toggleTheme, 
        clearAllData, 
        fetchData, 
        loading,
        pathfindingMode,
        setPathfindingMode,
        clearPathfinding,
        pathStart,
        pathEnd,
        foundPath
    } = useApp();
    
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [createViewModalOpen, setCreateViewModalOpen] = useState(false);
    const [createRelationModalOpen, setCreateRelationModalOpen] = useState(false);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [clearDialogOpen, setClearDialogOpen] = useState(false);

    const handleClearAll = async () => {
        try {
            await clearAllData();
            toast.success('Totes les dades han estat eliminades');
        } catch (err) {
            toast.error('Error eliminant les dades');
        }
        setClearDialogOpen(false);
    };

    const handleRefresh = async () => {
        try {
            await fetchData();
            toast.success('Dades actualitzades');
        } catch (err) {
            toast.error('Error actualitzant');
        }
    };

    const handlePathfindingToggle = () => {
        if (pathfindingMode) {
            clearPathfinding();
            toast.info('Mode de cerca de camí desactivat');
        } else {
            setPathfindingMode(true);
            toast.info('Selecciona la vista d\'origen');
        }
    };

    return (
        <TooltipProvider>
            <div className="toolbar" data-testid="toolbar">
                {/* Import SQL */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setImportModalOpen(true)}
                            data-testid="import-sql-btn"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Importar SQL
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Importa vistes i relacions des de SQL</p>
                    </TooltipContent>
                </Tooltip>

                {/* Create View */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCreateViewModalOpen(true)}
                            data-testid="create-view-btn"
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Crear nova vista</p>
                    </TooltipContent>
                </Tooltip>

                {/* Create Relation */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCreateRelationModalOpen(true)}
                            data-testid="create-relation-btn"
                        >
                            <GitBranch className="w-4 h-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Crear nova relació</p>
                    </TooltipContent>
                </Tooltip>

                <div className="w-px h-6 bg-border" />

                {/* Pathfinding */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={pathfindingMode ? "default" : "outline"}
                            size="sm"
                            onClick={handlePathfindingToggle}
                            className={pathfindingMode ? "bg-accent text-accent-foreground" : ""}
                            data-testid="pathfinding-btn"
                        >
                            {pathfindingMode ? (
                                <>
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel·lar
                                </>
                            ) : (
                                <>
                                    <Route className="w-4 h-4 mr-2" />
                                    Trobar camí
                                </>
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Cerca el camí entre dues vistes</p>
                    </TooltipContent>
                </Tooltip>

                {/* Path info */}
                {pathfindingMode && (
                    <div className="flex items-center gap-2 px-2 py-1 rounded bg-secondary/50 text-xs">
                        {!pathStart && <span className="text-muted-foreground">Selecciona origen...</span>}
                        {pathStart && !pathEnd && <span className="text-muted-foreground">Selecciona destí...</span>}
                        {foundPath && !foundPath.notFound && (
                            <span className="text-green-500 font-medium">
                                Camí trobat! ({foundPath.nodes?.length} nodes)
                            </span>
                        )}
                        {foundPath?.notFound && (
                            <span className="text-red-500 font-medium">
                                No hi ha camí
                            </span>
                        )}
                    </div>
                )}

                <div className="w-px h-6 bg-border" />

                {/* Refresh */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleRefresh}
                            disabled={loading}
                            data-testid="refresh-btn"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Actualitzar dades</p>
                    </TooltipContent>
                </Tooltip>

                {/* Clear All */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setClearDialogOpen(true)}
                            data-testid="clear-all-btn"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Eliminar totes les dades</p>
                    </TooltipContent>
                </Tooltip>

                <div className="w-px h-6 bg-border" />

                {/* Settings */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSettingsModalOpen(true)}
                            data-testid="settings-btn"
                        >
                            <Settings className="w-4 h-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Configuració</p>
                    </TooltipContent>
                </Tooltip>

                {/* Theme Toggle */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            data-testid="theme-toggle-btn"
                        >
                            {settings.theme === 'dark' ? (
                                <Sun className="w-4 h-4" />
                            ) : (
                                <Moon className="w-4 h-4" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{settings.theme === 'dark' ? 'Canviar a mode clar' : 'Canviar a mode fosc'}</p>
                    </TooltipContent>
                </Tooltip>

                {/* Modals */}
                <SqlImportModal 
                    open={importModalOpen} 
                    onOpenChange={setImportModalOpen} 
                />
                <CreateViewModal 
                    open={createViewModalOpen} 
                    onOpenChange={setCreateViewModalOpen} 
                />
                <CreateRelationModal 
                    open={createRelationModalOpen} 
                    onOpenChange={setCreateRelationModalOpen} 
                />
                <SettingsModal
                    open={settingsModalOpen}
                    onOpenChange={setSettingsModalOpen}
                />

                {/* Clear Confirmation Dialog */}
                <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar totes les dades?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Aquesta acció eliminarà totes les vistes i relacions de forma permanent.
                                No es pot desfer.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel data-testid="cancel-clear-btn">
                                Cancel·lar
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleClearAll}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                data-testid="confirm-clear-btn"
                            >
                                Eliminar tot
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </TooltipProvider>
    );
};
