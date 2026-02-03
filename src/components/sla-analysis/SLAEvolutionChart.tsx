import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Line,
    ComposedChart,
    Scatter
} from 'recharts';
import { format } from 'date-fns';
import { HistoricalPoint } from '@/hooks/useSLAAnalysis';
import { AlertCircle } from 'lucide-react';

interface SLAEvolutionChartProps {
    data: HistoricalPoint[];
    onPointClick: (point: HistoricalPoint | null) => void;
    selectedPoint: HistoricalPoint | null;
}

export function SLAEvolutionChart({ data, onPointClick, selectedPoint }: SLAEvolutionChartProps) {
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const point = payload[0].payload;
            return (
                <div className="glass p-4 border border-white/10 rounded-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                    <p className="text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-widest border-b border-white/5 pb-2">
                        Dia: {format(new Date(point.timestamp), 'dd/MM')}
                    </p>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-8">
                            <span className="text-[10px] text-muted-foreground uppercase">Maior SLA</span>
                            <span className="text-sm font-bold text-blue-400">{point.max}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-8">
                            <span className="text-[10px] text-muted-foreground uppercase">Menor SLA</span>
                            <span className="text-sm font-bold text-orange-400">{point.min}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-8 pt-1 border-t border-white/5">
                            <span className="text-[10px] text-muted-foreground uppercase">Média do dia</span>
                            <span className="text-sm font-bold text-white">{point.avg}%</span>
                        </div>
                    </div>
                    {point.hasAnomaly && (
                        <div className="mt-3 pt-2 border-t border-orange-500/20 flex items-start gap-2">
                            <AlertCircle className="h-3 w-3 text-orange-400 mt-0.5" />
                            <p className="text-[10px] text-orange-400/90 leading-tight">
                                Anomalia detectada: queda fora do padrão histórico
                            </p>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    // Prepare data for Recharts Range Area (dataKey with array requires specific item structure)
    // Actually, we'll use a trick: two Area components with a clipPath or just different base values.
    // However, Recharts 2.x supports [min, max] as a dataKey value if mapped correctly.
    const chartData = data.map(p => ({
        ...p,
        range: [p.min, p.max], // [bottom, top]
        anomalyY: p.hasAnomaly ? p.max + 1 : null // Position for the marker
    }));

    return (
        <div className="glass rounded-xl p-6 h-[400px]">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-lg font-bold text-foreground">Evolução Diária de SLA</h3>
                    <p className="text-xs text-muted-foreground">Visão de estabilidade (Min/Max/Média) no mês corrente</p>
                </div>

                {selectedPoint && (
                    <button
                        onClick={() => onPointClick(null)}
                        className="text-[10px] bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded border border-blue-500/20 hover:bg-blue-500/20 transition-all font-bold uppercase tracking-widest"
                    >
                        Limpar Filtro Temporal
                    </button>
                )}
            </div>

            {chartData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-white/5 rounded-lg bg-white/5">
                    <p className="text-sm text-muted-foreground italic text-center px-10">
                        Não há dados suficientes para análise no período atual.
                    </p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="85%">
                    <ComposedChart
                        data={chartData}
                        margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                        onClick={(e) => {
                            if (e && e.activePayload) {
                                onPointClick(e.activePayload[0].payload);
                            }
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                        <XAxis
                            dataKey="timestamp"
                            tickFormatter={(value) => format(new Date(value), 'dd')}
                            stroke="rgba(255,255,255,0.3)"
                            fontSize={11}
                            axisLine={false}
                            tickLine={false}
                            minTickGap={20}
                        />
                        <YAxis
                            domain={[0, 100]}
                            stroke="rgba(255,255,255,0.3)"
                            fontSize={10}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val) => `${val}%`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }} />

                        {/* Range Area */}
                        <Area
                            type="monotone"
                            dataKey="range"
                            stroke="none"
                            fill="#0ea5e9"
                            fillOpacity={0.2}
                            animationDuration={2000}
                        />

                        {/* Average Line */}
                        <Line
                            type="monotone"
                            dataKey="avg"
                            stroke="#0ea5e9"
                            strokeWidth={1.5}
                            strokeDasharray="4 4"
                            dot={false}
                            activeDot={false}
                        />

                        {/* Anomaly Markers */}
                        <Scatter
                            dataKey="anomalyY"
                            fill="#f97316"
                            shape={(props: any) => {
                                const { cx, cy } = props;
                                if (props.payload.anomalyY === null) return null;
                                return (
                                    <g>
                                        <circle cx={cx} cy={cy - 10} r={5} fill="#f97316" fillOpacity={0.4} className="animate-pulse" />
                                        <circle cx={cx} cy={cy - 10} r={2} fill="#ea580c" />
                                    </g>
                                );
                            }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
