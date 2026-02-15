import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
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
  X,
  Copy,
  Sparkles,
} from "lucide-react";
import { SqlImportModal } from "../modals/SqlImportModal";
import { CreateViewModal } from "../modals/CreateViewModal";
import { CreateRelationModal } from "../modals/CreateRelationModal";
import { SettingsModal } from "../modals/SettingsModal";
import { toast } from "sonner";

export const Toolbar = () => {
  const {
    settings,
    toggleTheme,
    clearAllData,
    clearNewItems,
    fetchData,
    loading,
    pathfindingMode,
    setPathfindingMode,
    clearPathfinding,
    pathStart,
    pathEnd,
    foundPath,
    newViews,
    newRelations,
    exportViewAsSql,
    exportRelationAsSql,
    views,
    copyToClipboard,
  } = useApp();

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [createViewModalOpen, setCreateViewModalOpen] = useState(false);
  const [createRelationModalOpen, setCreateRelationModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearNewDialogOpen, setClearNewDialogOpen] = useState(false);

  const handleClearAll = async () => {
    try {
      await clearAllData();
      toast.success("Totes les dades han estat eliminades");
    } catch (err) {
      toast.error("Error eliminant les dades");
    }
    setClearDialogOpen(false);
  };

  const handleClearNewItems = async () => {
    try {
      await clearNewItems();
      toast.success("Tots els elements nous han estat eliminats");
    } catch (err) {
      toast.error("Error eliminant elements nous");
    }
    setClearNewDialogOpen(false);
  };

  const handleRefresh = async () => {
    try {
      await fetchData();
      toast.success("Dades actualitzades");
    } catch (err) {
      toast.error("Error actualitzant");
    }
  };

  const handlePathfindingToggle = () => {
    if (pathfindingMode) {
      clearPathfinding();
      toast.info("Mode de cerca de camí desactivat");
    } else {
      setPathfindingMode(true);
      toast.info("Selecciona la vista d'origen");
    }
  };

  const handleExportNewItems = async (type) => {
    let sql = "";

    if (type === "all" || type === "views") {
      newViews.forEach((v) => {
        const view = views.find((view) => view.view_id === v.view_id);
        if (view) {
          sql += exportViewAsSql(view, "INSERT") + "\n";
        }
      });
    }

    if (type === "all" || type === "relations") {
      newRelations.forEach((r) => {
        sql += exportRelationAsSql(r, "INSERT") + "\n";
      });
    }

    if (sql) {
      const success = await copyToClipboard(sql.trim());
      if (success) {
        toast.success("SQL copiat al portapapers");
      } else {
        toast.error("No s'ha pogut copiar automàticament");
        window.prompt("Copia aquest SQL:", sql.trim());
      }
    } else {
      toast.info("No hi ha elements nous per exportar");
    }
  };

  const hasNewItems = newViews.length > 0 || newRelations.length > 0;

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
              className={
                pathfindingMode ? "bg-accent text-accent-foreground" : ""
              }
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
            {!pathStart && (
              <span className="text-muted-foreground">
                Selecciona origen...
              </span>
            )}
            {pathStart && !pathEnd && (
              <span className="text-muted-foreground">Selecciona destí...</span>
            )}
            {foundPath && !foundPath.notFound && (
              <span className="text-green-500 font-medium">
                Camí trobat! ({foundPath.nodes?.length} nodes)
              </span>
            )}
            {foundPath?.notFound && (
              <span className="text-red-500 font-medium">No hi ha camí</span>
            )}
          </div>
        )}

        <div className="w-px h-6 bg-border" />

        {/* Export new items */}
        {hasNewItems && (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20"
                    data-testid="export-new-btn"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Nous ({newViews.length + newRelations.length})
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Exportar elements nous com a SQL</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => handleExportNewItems("all")}
                data-testid="export-all-new"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar tot ({newViews.length + newRelations.length} INSERTs)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {newViews.length > 0 && (
                <DropdownMenuItem
                  onClick={() => handleExportNewItems("views")}
                  data-testid="export-new-views"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar vistes noves ({newViews.length})
                </DropdownMenuItem>
              )}
              {newRelations.length > 0 && (
                <DropdownMenuItem
                  onClick={() => handleExportNewItems("relations")}
                  data-testid="export-new-relations"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar relacions noves ({newRelations.length})
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setClearNewDialogOpen(true)}
                className="text-destructive focus:text-destructive"
                data-testid="delete-all-new"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar nous ({newViews.length + newRelations.length})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
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
              {settings.theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {settings.theme === "dark"
                ? "Canviar a mode clar"
                : "Canviar a mode fosc"}
            </p>
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
                Aquesta acció eliminarà totes les vistes i relacions de forma
                permanent. No es pot desfer.
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

        {/* Clear New Items Confirmation Dialog */}
        <AlertDialog
          open={clearNewDialogOpen}
          onOpenChange={setClearNewDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Eliminar tots els elements nous?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Aquesta acció eliminarà {newViews.length} vistes i{" "}
                {newRelations.length} relacions noves de forma permanent. No es
                pot desfer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="cancel-clear-new-btn">
                Cancel·lar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearNewItems}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="confirm-clear-new-btn"
              >
                Eliminar nous
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};
