import { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BacklogIntradiarioRecord } from '@/hooks/useBacklogData';

interface BacklogVariacaoDiariaChartProps {
    data: BacklogIntradiarioRecord[];
}

export function BacklogVariacaoDiariaChart({ data }: BacklogVariacaoDiariaChartProps) {
    const chartData = useMemo(() => {
        // Group by date
        const dateGroups = new Map<string, { manha?: number, fim?: number }>();

        data.forEach(r => {
            const current = dateGroups.get(r.data_snapshot) || {};
            if (r.periodo === 'MANHA') current.manha = r.total_backlog;
            if (r.periodo === 'FIM_DIA') current.fim = r.total_backlog;
            dateGroups.set(r.data_snapshot, current);
        });

        // Convert to variation array
        return Array.from(dateGroups.entries())
            .filter(([_, values]) => values.manha !== undefined && values.fim !== undefined)
            .map(([date, values]) => ({
                date: format(parseISO(date), 'dd/MM', { locale: ptBR }),
                fullDate: date,
                variacao: values.fim! - values.manha!,
                manha: values.manha,
                fim: values.fim
            }))
            .sort((a, b) => a.fullDate.localeCompare(b.fullDate));
    }, [data]);

    if (chartData.length === 0) {
        return (
            <div className="glass rounded-xl p-6 h-[400px] flex items-center justify-center text-muted-foreground border border-border/50">
                Sem dados históricos para variação diária
            </div>
        );
    }

    return (
        <div className="glass rounded-xl p-6 border border-border/50 bg-secondary/10">
            <div className="flex flex-col gap-1 mb-6">
                <h3 className="text-lg font-bold text-foreground">Tendência de Variação Diária</h3>
                <p className="text-sm text-muted-foreground">Evolução da variação entre o início (08h) e fim (18h) de cada dia</p>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                            }}
                            labelStyle={{ color: '#f1f5f9', fontWeight: 'bold', marginBottom: '4px' }}
                            itemStyle={{ outline: 'none' }}
                            formatter={(value: number) => [
                                <span className={value > 0 ? 'text-red-400' : 'text-green-400'}>
                                    {value > 0 ? '+' : ''}{value} chamados
                                </span>,
                                "Variação"
                            ]}
                        />
                        <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                        <Line
                            type="monotone"
                            dataKey="variacao"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#1e293b' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            animationDuration={1500}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 flex justify-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-red-400"></div>
                    <span>Acima de 0: Backlog aumentou no dia</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-green-400"></div>
                    <span>Abaixo de 0: Backlog reduziu no dia</span>
                </div>
            </div>
        </div>
    );
}
