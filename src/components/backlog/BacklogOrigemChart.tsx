import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { BacklogItem } from '@/hooks/useBacklogData';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BacklogOrigemChartProps {
    data: BacklogItem[];
}

export function BacklogOrigemChart({ data }: BacklogOrigemChartProps) {
    const chartData = useMemo(() => {
        const dayMap: Record<string, number> = {};
        data.forEach(item => {
            if (!item.data_criacao) return;
            const day = item.data_criacao.slice(0, 10);
            dayMap[day] = (dayMap[day] || 0) + 1;
        });

        return Object.entries(dayMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-60) // last 60 days
            .map(([date, count]) => ({
                date,
                label: format(parseISO(date), 'dd/MM', { locale: ptBR }),
                count,
            }));
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
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                    dataKey="label"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    interval={Math.max(0, Math.floor(chartData.length / 20) - 1)}
                />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '8px',
                        padding: '10px 14px',
                    }}
                    labelStyle={{ color: '#f1f5f9', fontWeight: 600, marginBottom: 4 }}
                    formatter={(value: number) => [value, 'Chamados ainda abertos']}
                    labelFormatter={(label, payload) => {
                        if (payload?.[0]) return `Data criação: ${payload[0].payload.date}`;
                        return label;
                    }}
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
                <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} name="Chamados ainda abertos" />
            </BarChart>
        </ResponsiveContainer>
    );
}
