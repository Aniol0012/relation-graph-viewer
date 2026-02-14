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
import { Textarea } from '../ui/textarea';
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const SqlImportModal = ({ open, onOpenChange }) => {
    const { importSql } = useApp();
    const [sql, setSql] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleImport = async () => {
        if (!sql.trim()) {
            toast.error('Si us plau, enganxa el codi SQL');
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const res = await importSql(sql);
            setResult(res);
            
            if (res.views_created > 0 || res.relations_created > 0) {
                toast.success(`Importat: ${res.views_created} vistes, ${res.relations_created} relacions`);
            }
            
            if (res.errors?.length > 0) {
                toast.warning(`${res.errors.length} errors durant la importació`);
            }
        } catch (err) {
            toast.error('Error durant la importació');
            setResult({ errors: [err.message] });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSql('');
        setResult(null);
        onOpenChange(false);
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setSql(text);
            toast.success('Text enganxat del portapapers');
        } catch (err) {
            toast.error('No s\'ha pogut accedir al portapapers');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="font-heading flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Importar SQL
                    </DialogTitle>
                    <DialogDescription>
                        Enganxa els INSERTs de Report_View i Report_ViewRelation
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4">
                    {/* SQL Input */}
                    <div className="flex-1 overflow-hidden">
                        <Textarea
                            value={sql}
                            onChange={(e) => setSql(e.target.value)}
                            placeholder={`INSERT INTO Report_View (IdView, Name, Name2, Alias) VALUES(...);
INSERT INTO Report_ViewRelation (IdView1, IdView2, Relation, ...) VALUES(...);`}
                            className="h-full min-h-[200px] font-mono text-sm resize-none"
                            data-testid="sql-import-textarea"
                        />
                    </div>

                    {/* Result */}
                    {result && (
                        <div className={`p-3 rounded-lg ${result.errors?.length > 0 && result.views_created === 0 && result.relations_created === 0 ? 'bg-destructive/10' : 'bg-green-500/10'}`}>
                            <div className="flex items-start gap-2">
                                {result.errors?.length > 0 && result.views_created === 0 && result.relations_created === 0 ? (
                                    <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                                ) : (
                                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                                )}
                                <div>
                                    <div className="font-medium">
                                        {result.views_created} vistes creades, {result.relations_created} relacions creades
                                    </div>
                                    {result.errors?.length > 0 && (
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {result.errors.length} errors
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-border">
                    <Button
                        variant="outline"
                        onClick={handlePaste}
                        data-testid="paste-btn"
                    >
                        Enganxar
                    </Button>
                    <div className="flex-1" />
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        data-testid="cancel-import-btn"
                    >
                        Tancar
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={loading || !sql.trim()}
                        data-testid="import-btn"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Important...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2" />
                                Importar
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
