import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useHistoryData, HistoryType, Granularity, HistoryDataPoint } from "@/hooks/useHistoryData";
import { useComments } from "@/hooks/useComments";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, DotProps } from "recharts";
import { Loader2, TrendingUp, TrendingDown, MessageSquare, AlertCircle, Calendar, Clock, History, MessageSquarePlus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: HistoryType;
    identifier: string;
    title: string;
}

export function HistoryModal({ isOpen, onClose, type, identifier, title }: HistoryModalProps) {
    const [granularity, setGranularity] = useState<Granularity>('daily');
    const { data, isLoading } = useHistoryData({ type, identifier, isOpen, granularity });
    const { comments, addComment } = useComments({ type, identifier });

    const [selectedPoint, setSelectedPoint] = useState<any | null>(null);
    const [commentText, setCommentText] = useState("");
    const [isIncident, setIsIncident] = useState(false);
    const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
    const [customMeta, setCustomMeta] = useState<any>(null);

    // Fetch custom metas for the identifier
    useEffect(() => {
        if (isOpen && type === 'mps') {
            const fetchMeta = async () => {
                const { data } = await supabase
                    .from('sla_metas' as any)
                    .select('*')
                    .eq('tipo', 'mps')
                    .eq('identificador', identifier)
                    .maybeSingle();
                if (data) setCustomMeta(data);
            };
            fetchMeta();
        }
    }, [isOpen, identifier, type]);

    // Calculate Min/Max for highlights
    const { minPoint, maxPoint, latestStats } = useMemo(() => {
        const historyData = data as HistoryDataPoint[];
        if (!historyData || historyData.length === 0) return { minPoint: null, maxPoint: null, latestStats: null };

        let min = historyData[0];
        let max = historyData[0];

        historyData.forEach(point => {
            if (point.percentual < min.percentual) min = point;
            if (point.percentual > max.percentual) max = point;
        });

        // Get latest point for indicators
        const latest = historyData[historyData.length - 1];
        const stats = latest ? {
            totalBase: latest.total_base || 0,
            totalSem: latest.total_sem_monitoramento || 0,
            totalMonitoradas: (latest.total_base || 0) - (latest.total_sem_monitoramento || 0),
            percentual: latest.percentual,
        } : null;

        return { minPoint: min, maxPoint: max, latestStats: stats };
    }, [data]);

    const classification = useMemo(() => {
        if (!latestStats) return null;
        const metaExcelente = customMeta?.meta_excelente ?? 98;
        const metaAtencao = customMeta?.meta_atencao ?? 80;

        if (latestStats.percentual >= metaExcelente) return { label: 'Excelente', color: 'text-chart-green' };
        if (latestStats.percentual >= metaAtencao) return { label: 'Atenção', color: 'text-chart-yellow' };
        return { label: 'Crítico', color: 'text-chart-red' };
    }, [latestStats, customMeta]);

    const handlePointClick = (data: any) => {
        if (data && data.activePayload && data.activePayload.length > 0) {
            const point = data.activePayload[0].payload;
            setSelectedPoint(point);
            setCommentText(""); // Reset text
            setIsIncident(false);
            setIsCommentDialogOpen(true);
        }
    };

    const handleSaveComment = () => {
        if (selectedPoint && commentText) {
            // Need a full timestamp. HistoryDataPoint has 'fullDate' which is ISO-like or YYYY-MM-DD.
            // If it's a date string without time, we might want to append time if granularity is daily, or just use as is.
            // useComments expects timestamp_coleta string.
            // If granularity is hourly, fullDate should already have hour.

            // Ensure valid ISO string
            const timestamp = selectedPoint.fullDate.includes('T') || selectedPoint.fullDate.includes(':')
                ? new Date(selectedPoint.fullDate).toISOString()
                : new Date(selectedPoint.fullDate).toISOString();

            addComment.mutate({
                tipo_monitoramento: type,
                identificador_item: identifier,
                timestamp_coleta: timestamp,
                texto_comentario: commentText,
                is_incident: isIncident,
            });
            setIsCommentDialogOpen(false);
        }
    };

    const CustomDot = (props: any) => {
        const { cx, cy, payload } = props;
        const isMin = minPoint && payload.date === minPoint.date && payload.percentual === minPoint.percentual;
        const isMax = maxPoint && payload.date === maxPoint.date && payload.percentual === maxPoint.percentual;

        // Check if there is a comment for this date/time
        // Logic: if daily, match YYYY-MM-DD. If hourly, match YYYY-MM-DD HH or similar.
        const hasComment = comments?.some(c => {
            const commentTime = c.timestamp_coleta;
            // We can check if the comment timestamp (ISO) starts with the payload date prefix.
            // Payload.fullDate depends on useHistoryData format.
            // Daily: YYYY-MM-DD. Hourly: YYYY-MM-DD HH (or ISO).
            // Let's rely on simple string matching of the YYYY-MM-DD part for daily, and maybe include hour for hourly.

            if (granularity === 'daily') {
                return commentTime.startsWith(payload.fullDate);
            } else {
                // Hourly fullDate: YYYY-MM-DD HH
                // Comment ISO: YYYY-MM-DDTHH:mm:ss.sssZ
                // We need to match YYYY-MM-DD and HH.
                const pDate = payload.fullDate; // "2023-10-27 10"
                const cDate = commentTime.replace('T', ' ').substring(0, 13); // "2023-10-27 10"
                return cDate === pDate;
            }
        });

        const isIncidentPoint = comments?.some(c => {
            if (!c.is_incident) return false;
            if (granularity === 'daily') {
                return c.timestamp_coleta.startsWith(payload.fullDate);
            } else {
                const pDate = payload.fullDate;
                const cDate = c.timestamp_coleta.replace('T', ' ').substring(0, 13);
                return cDate === pDate;
            }
        });

        if (isIncidentPoint) {
            return (
                <circle cx={cx} cy={cy} r={6} fill="hsl(var(--destructive))" stroke="#fff" strokeWidth={2} className="cursor-pointer" />
            );
        }
        if (hasComment) {
            return (
                <circle cx={cx} cy={cy} r={5} fill="hsl(var(--primary))" stroke="white" strokeWidth={2} className="cursor-pointer" />
            );
        }

        if (isMin) {
            return (
                <circle cx={cx} cy={cy} r={6} fill="hsl(var(--chart-red))" stroke="#fff" strokeWidth={2} />
            );
        }
        if (isMax) {
            return (
                <circle cx={cx} cy={cy} r={6} fill="hsl(var(--chart-green))" stroke="#fff" strokeWidth={2} />
            );
        }
        return <circle cx={cx} cy={cy} r={4} fill="hsl(var(--primary))" strokeWidth={0} />;
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload;
            const isMin = minPoint && dataPoint.date === minPoint.date;
            const isMax = maxPoint && dataPoint.date === maxPoint.date;

            // Filter comments for this point
            const dayComments = comments?.filter(c => {
                if (granularity === 'daily') {
                    return c.timestamp_coleta.startsWith(dataPoint.fullDate);
                } else {
                    const pDate = dataPoint.fullDate;
                    const cDate = c.timestamp_coleta.replace('T', ' ').substring(0, 13);
                    return cDate === pDate;
                }
            }) || [];

            return (
                <div className="bg-popover border border-border rounded-lg p-3 shadow-lg max-w-[250px] z-50">
                    <p className="text-muted-foreground text-xs mb-1">{label}</p>
                    <p className="font-bold text-foreground text-lg">{dataPoint.percentual}%</p>
                    {isMin && (
                        <div className="flex items-center gap-1 text-red-500 text-xs mt-1 font-medium">
                            <TrendingDown className="h-3 w-3" />
                            Maior queda do período
                        </div>
                    )}
                    {isMax && (
                        <div className="flex items-center gap-1 text-green-500 text-xs mt-1 font-medium">
                            <TrendingUp className="h-3 w-3" />
                            Melhor desempenho
                        </div>
                    )}

                    {dayComments.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                            {dayComments.map((c) => (
                                <div key={c.id} className="text-xs flex gap-2 items-start">
                                    {c.is_incident ? <AlertCircle className="h-3 w-3 text-destructive shrink-0 mt-0.5" /> : <MessageSquare className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />}
                                    <span className="text-foreground/90">{c.texto_comentario}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="text-[10px] text-muted-foreground mt-2 italic">
                        Clique para adicionar nota
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-[800px] glass border-white/10">
                    <DialogHeader className="flex flex-row items-center justify-between pr-8">
                        <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                            {identifier}
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                                | {title}
                            </span>
                        </DialogTitle>

                        {/* Granularity Toggle */}
                        <ToggleGroup type="single" value={granularity} onValueChange={(val) => val && setGranularity(val as Granularity)}>
                            <ToggleGroupItem value="daily" size="sm" aria-label="Vista Diária">
                                <Calendar className="h-4 w-4 mr-2" />
                                15 Dias
                            </ToggleGroupItem>
                            <ToggleGroupItem value="hourly" size="sm" aria-label="Vista Horária">
                                <Clock className="h-4 w-4 mr-2" />
                                5 Dias (Horas)
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </DialogHeader>

                    {/* Indicators Section */}
                    {latestStats && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                            <div className="glass p-3 rounded-lg text-center">
                                <p className="text-[10px] text-muted-foreground uppercase">Máquinas</p>
                                <p className="text-sm font-bold">{latestStats.totalBase.toLocaleString()}</p>
                            </div>
                            <div className="glass p-3 rounded-lg text-center">
                                <p className="text-[10px] text-muted-foreground uppercase">Monitoradas</p>
                                <p className="text-sm font-bold text-chart-green">{latestStats.totalMonitoradas.toLocaleString()}</p>
                            </div>
                            <div className="glass p-3 rounded-lg text-center">
                                <p className="text-[10px] text-muted-foreground uppercase">Sem Comunc.</p>
                                <p className="text-sm font-bold text-chart-red">{latestStats.totalSem.toLocaleString()}</p>
                            </div>
                            <div className="glass p-3 rounded-lg text-center">
                                <p className="text-[10px] text-muted-foreground uppercase">Percentual</p>
                                <p className="text-sm font-bold text-primary">{latestStats.percentual}%</p>
                            </div>
                            <div className="glass p-3 rounded-lg text-center">
                                <p className="text-[10px] text-muted-foreground uppercase">Status</p>
                                <p className={`text-sm font-bold ${classification?.color}`}>{classification?.label}</p>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 h-[400px] w-full flex items-center justify-center bg-black/20 rounded-lg p-4">
                        {isLoading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        ) : !data || data.length === 0 ? (
                            <div className="text-center text-muted-foreground p-6">
                                <p>Este item ainda não possui dados históricos para exibição.</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={data}
                                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                    onClick={handlePointClick}
                                >
                                    <defs>
                                        <linearGradient id="colorPercent" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}%`}
                                        domain={[0, 100]}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                    <Area
                                        type="monotone"
                                        dataKey="percentual"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorPercent)"
                                        dot={CustomDot}
                                        activeDot={{ r: 6, strokeWidth: 0, className: "cursor-pointer" }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="flex justify-between items-center mt-4 px-4">
                        <div className="text-xs text-muted-foreground">
                            {granularity === 'daily' ? 'Exibindo histórico diário dos últimos 15 dias.' : 'Exibindo histórico horário dos últimos 5 dias.'} Clique nos pontos para interagir.
                        </div>
                        {/* Summary Legend */}
                        {(minPoint || maxPoint) && (
                            <div className="flex gap-4 text-xs">
                                {minPoint && (
                                    <div className="flex items-center gap-1 text-red-500/80">
                                        <TrendingDown className="h-3 w-3" />
                                        <span>Min: {minPoint.percentual}% ({minPoint.date})</span>
                                    </div>
                                )}
                                {maxPoint && (
                                    <div className="flex items-center gap-1 text-green-500/80">
                                        <TrendingUp className="h-3 w-3" />
                                        <span>Max: {maxPoint.percentual}% ({maxPoint.date})</span>
                                    </div>
                                )}
                            </div>
                        )}
                        <Button variant="default" className="bg-primary hover:bg-primary/90 ml-auto gap-2">
                            Abrir Chamado
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Adicionar Anotação</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{selectedPoint?.date}</span>
                            <span className="font-bold">{selectedPoint?.percentual}%</span>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="comment">Comentário</Label>
                            <Input
                                id="comment"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Descreva o que aconteceu..."
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="incident"
                                checked={isIncident}
                                onCheckedChange={(checked) => setIsIncident(checked as boolean)}
                            />
                            <label
                                htmlFor="incident"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                            >
                                <AlertCircle className="h-4 w-4 text-destructive" />
                                Marcar como Incidente
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCommentDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveComment}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
