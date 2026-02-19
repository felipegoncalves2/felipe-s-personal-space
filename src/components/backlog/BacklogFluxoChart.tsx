import { useMemo } from 'react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { BacklogItem } from '@/hooks/useBacklogData';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BacklogFluxoChartProps {
    data: BacklogItem[];
}

export function BacklogFluxoChart({ data }: BacklogFluxoChartProps) {
    const chartData = useMemo(() => {
        // Group open tickets by creation date
        const openByDay: Record<string, number> = {};
        data.forEach(item => {
            if (!item.data_criacao) return;
            const day = item.data_criacao.slice(0, 10);
            openByDay[day] = (openByDay[day] || 0) + 1;
        });

        const sortedDays = Object.keys(openByDay).sort().slice(-60);

        // Calculate cumulative backlog
        let cumulative = 0;
        return sortedDays.map(date => {
            const abertos = openByDay[date] || 0;
            cumulative += abertos;
            return {
                date,
                label: format(parseISO(date), 'dd/MM', { locale: ptBR }),
                abertos,
                backlogAcumulado: cumulative,
            };
        });
    }, [data]);

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                Sem dados para exibir
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={450}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                    dataKey="label"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    interval={Math.max(0, Math.floor(chartData.length / 15) - 1)}
                />
                <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '8px',
                        padding: '10px 14px',
                    }}
                    labelStyle={{ color: '#f1f5f9', fontWeight: 600, marginBottom: 4 }}
                    itemStyle={{ color: '#cbd5e1', fontSize: '12px' }}
                />
                <Legend
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{
                        paddingTop: 30,
                        fontSize: 12,
                        color: '#94a3b8',
                    }}
                />
                <Bar yAxisId="left" dataKey="abertos" fill="#6366f1" radius={[3, 3, 0, 0]} name="Abertos no dia" />
                <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="backlogAcumulado"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={false}
                    name="Backlog Acumulado"
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
}
