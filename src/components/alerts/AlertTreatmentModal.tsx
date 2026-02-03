import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MonitoringAlert } from '@/types';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AlertTreatmentModalProps {
    alert: MonitoringAlert | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (comment: string) => void;
}

export function AlertTreatmentModal({ alert, isOpen, onClose, onConfirm }: AlertTreatmentModalProps) {
    const [comment, setComment] = useState('');

    if (!alert) return null;

    const handleConfirm = () => {
        onConfirm(comment);
        setComment('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] glass border-primary/20">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Tratar Alerta
                        <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {alert.severity.toUpperCase()}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Tipo</p>
                            <p className="font-medium">{alert.tipo_monitoramento.toUpperCase()}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Item</p>
                            <p className="font-medium">{alert.identificador_item}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Regra</p>
                            <p className="font-medium text-primary">{alert.alert_type.toUpperCase()}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Detectado em</p>
                            <p className="font-medium">{format(new Date(alert.detected_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-tight">Comentário de Tratamento</p>
                        <Textarea
                            placeholder="Descreva a ação tomada para este alerta..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[100px] bg-secondary/50 border-primary/10"
                        />
                    </div>

                    {alert.contexto && (
                        <div className="p-3 rounded-md bg-secondary/30 border border-border/50">
                            <p className="text-xs text-muted-foreground font-medium mb-1 uppercase tracking-tight">Contexto da Detecção</p>
                            <pre className="text-[10px] text-foreground/80 overflow-auto max-h-[60px]">
                                {JSON.stringify(alert.contexto, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button
                        variant="default"
                        onClick={handleConfirm}
                        disabled={!comment.trim()}
                        className="bg-primary hover:bg-primary/90"
                    >
                        Marcar como Tratado
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
