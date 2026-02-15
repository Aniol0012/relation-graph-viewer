import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { GitBranch, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const CreateRelationFromNodeModal = ({
  open,
  onOpenChange,
  sourceId,
  targetId,
}) => {
  const { createRelation, views } = useApp();
  const [loading, setLoading] = useState(false);

  const sourceView = views.find((v) => v.id === sourceId);
  const targetView = views.find((v) => v.id === targetId);

  const [formData, setFormData] = useState({
    joinType: "LEFT JOIN",
    relation: "",
    relation2: "",
    edge_weight: "10",
  });

  // Auto-generate relation suggestion
  useEffect(() => {
    if (sourceView && targetView) {
      const sourceName = sourceView.name || `View_${sourceView.view_id}`;
      const targetName = targetView.name || `View_${targetView.view_id}`;
      const suggestion = `${formData.joinType} ${targetName} ON ${targetName}.Id = ${sourceName}.${targetName}Id`;
      setFormData((prev) => ({
        ...prev,
        relation: suggestion,
      }));
    }
  }, [sourceView, targetView, formData.joinType]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.relation) {
      toast.error("La relació (SQL) és obligatòria");
      return;
    }

    setLoading(true);
    try {
      await createRelation({
        id_view1: sourceView.view_id,
        id_view2: targetView.view_id,
        relation: formData.relation,
        relation2: formData.relation2 || null,
        edge_weight: parseInt(formData.edge_weight) || 10,
      });
      toast.success("Relació creada correctament");
      onOpenChange(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error creant la relació");
    } finally {
      setLoading(false);
    }
  };

  if (!sourceView || !targetView) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Crear Nova Relació
          </DialogTitle>
          <DialogDescription>
            Defineix la relació SQL entre les dues vistes
          </DialogDescription>
        </DialogHeader>

        {/* Source -> Target display */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 mb-4">
          <div className="flex-1 text-center">
            <div className="text-xs text-muted-foreground mb-1">Origen</div>
            <div className="font-semibold">
              {sourceView.alias || sourceView.name}
            </div>
            <div className="text-xs font-mono text-muted-foreground">
              #{sourceView.view_id}
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-accent" />
          <div className="flex-1 text-center">
            <div className="text-xs text-muted-foreground mb-1">Destí</div>
            <div className="font-semibold">
              {targetView.alias || targetView.name}
            </div>
            <div className="text-xs font-mono text-muted-foreground">
              #{targetView.view_id}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Tipus de JOIN</Label>
            <Select
              value={formData.joinType}
              onValueChange={(val) =>
                setFormData({ ...formData, joinType: val })
              }
            >
              <SelectTrigger className="mt-1" data-testid="select-join-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LEFT JOIN">LEFT JOIN</SelectItem>
                <SelectItem value="RIGHT JOIN">RIGHT JOIN</SelectItem>
                <SelectItem value="INNER JOIN">INNER JOIN</SelectItem>
                <SelectItem value="CROSS JOIN">CROSS JOIN</SelectItem>
                <SelectItem value="FULL JOIN">FULL JOIN</SelectItem>
                <SelectItem value="JOIN">JOIN</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="relation">Relation (SQL) *</Label>
            <Textarea
              id="relation"
              value={formData.relation}
              onChange={(e) =>
                setFormData({ ...formData, relation: e.target.value })
              }
              placeholder="LEFT JOIN TableName ON TableName.Column = OtherTable.Column"
              className="mt-1 font-mono text-sm"
              rows={3}
              required
              data-testid="relation-sql-input"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Modifica la suggerència segons les columnes reals
            </p>
          </div>

          <div>
            <Label htmlFor="relation2">
              Relation2 (SQL amb schema complet)
            </Label>
            <Textarea
              id="relation2"
              value={formData.relation2}
              onChange={(e) =>
                setFormData({ ...formData, relation2: e.target.value })
              }
              placeholder="Opcional: versió amb DBCommon.TableName"
              className="mt-1 font-mono text-sm"
              rows={2}
              data-testid="relation2-sql-input"
            />
          </div>

          <div>
            <Label htmlFor="edge_weight">Edge Weight</Label>
            <Input
              id="edge_weight"
              type="number"
              value={formData.edge_weight}
              onChange={(e) =>
                setFormData({ ...formData, edge_weight: e.target.value })
              }
              className="mt-1 w-32"
              data-testid="edge-weight-input"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              data-testid="cancel-relation-btn"
            >
              Cancel·lar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
              data-testid="submit-relation-btn"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Crear Relació"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
