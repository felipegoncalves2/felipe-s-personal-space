import React, { useMemo } from 'react';
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { FluxoOperacionalRecord } from '@/hooks/useFluxoOperacional';

interface BacklogFluxoOperacionalChartProps {
    data: FluxoOperacionalRecord[];
    loading?: boolean;
}

export function BacklogFluxoOperacionalChart({ data, loading }: BacklogFluxoOperacionalChartProps) {
    if (loading) {
        return <div className="h-[400px] w-full bg-secondary/20 animate-pulse rounded-lg" />;
    }

    if (!data || data.length === 0) {
        return (
            <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground border border-dashed border-border rounded-lg">
                Sem dados de fluxo para o mês atual
            </div>
        );
    }

    return (
        <div className="h-[430px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        dataKey="display_dia"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#888', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#888', fontSize: 12 }}
                    />
                    <Tooltip
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                const abertos = payload.find(p => p.dataKey === 'abertos')?.value || 0;
                                const encerrados = payload.find(p => p.dataKey === 'encerrados')?.value || 0;
                                const evolucao = payload.find(p => p.dataKey === 'evolucao_acumulada')?.value || 0;
                                const saldoDia = (abertos as number) - (encerrados as number);
                                const saldoColor = saldoDia > 0 ? 'text-red-400' : saldoDia < 0 ? 'text-green-400' : 'text-gray-400';

                                return (
                                    <div className="glass p-4 border border-border/50 rounded-xl shadow-2xl backdrop-blur-md">
                                        <p className="text-sm font-bold text-foreground mb-2">Dia {label}</p>
                                        <div className="space-y-1.5 border-t border-white/5 pt-2">
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full bg-[#22c55e]" /> Abertos:
                                                </span>
                                                <span className="text-sm font-mono font-bold text-white">{abertos}</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full bg-[#ef4444]" /> Encerrados:
                                                </span>
                                                <span className="text-sm font-mono font-bold text-white">{encerrados}</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4 border-t border-white/5 mt-1 pt-1 italic">
                                                <span className="text-[10px] text-muted-foreground">Saldo do dia:</span>
                                                <span className={`text-[10px] font-bold ${saldoColor}`}>
                                                    {saldoDia > 0 ? `+${saldoDia}` : saldoDia}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4 border-t border-white/5 mt-1 pt-1">
                                                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full bg-[#f59e0b]" /> Evolução Acum.:
                                                </span>
                                                <span className="text-sm font-mono font-bold text-amber-400">{evolucao}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ paddingBottom: '20px', fontSize: '12px' }}
                    />

                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />

                    <Bar
                        dataKey="abertos"
                        name="Abertos"
                        fill="hsl(var(--success))"
                        radius={[4, 4, 0, 0]}
                        barSize={15}
                        animationDuration={1500}
                    />
                    <Bar
                        dataKey="encerrados"
                        name="Encerrados"
                        fill="hsl(var(--danger))"
                        radius={[4, 4, 0, 0]}
                        barSize={15}
                        animationDuration={1500}
                    />
                    <Line
                        type="monotone"
                        dataKey="evolucao_acumulada"
                        name="Evolução"
                        stroke="hsl(var(--warning))"
                        strokeWidth={3}
                        dot={{ r: 4, fill: 'hsl(var(--warning))', strokeWidth: 2, stroke: '#111' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        animationDuration={2000}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
