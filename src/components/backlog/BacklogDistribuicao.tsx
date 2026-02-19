import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BacklogItem } from '@/hooks/useBacklogData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BacklogDistribuicaoProps {
    data: BacklogItem[];
}

type Dimension = 'fila' | 'codigo_projeto' | 'empresa_nome' | 'status_cliente' | 'estado';

const DIMENSION_LABELS: Record<Dimension, string> = {
    fila: 'Fila',
    codigo_projeto: 'Projeto',
    empresa_nome: 'Empresa',
    status_cliente: 'Status Cliente',
    estado: 'Estado',
};

const COLORS = [
    '#6366f1', '#22c55e', '#eab308', '#f97316', '#ef4444',
    '#8b5cf6', '#06b6d4', '#84cc16', '#f43f5e', '#14b8a6',
    '#a78bfa', '#fb923c', '#4ade80', '#facc15', '#38bdf8',
];

export function BacklogDistribuicao({ data }: BacklogDistribuicaoProps) {
    const [dimension, setDimension] = useState<Dimension>('fila');

    const chartData = useMemo(() => {
        const map: Record<string, number> = {};
        data.forEach(item => {
            const key = (item[dimension] as string) || 'N/A';
            map[key] = (map[key] || 0) + 1;
        });
        return Object.entries(map)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12)
            .map(([name, value]) => ({ name, value }));
    }, [data, dimension]);

    const total = chartData.reduce((a, b) => a + b.value, 0);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Dimensão:</span>
                <Select value={dimension} onValueChange={(v) => setDimension(v as Dimension)}>
                    <SelectTrigger className="w-48 bg-secondary/50">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {(Object.keys(DIMENSION_LABELS) as Dimension[]).map(d => (
                            <SelectItem key={d} value={d}>{DIMENSION_LABELS[d]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                    Sem dados para exibir
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={450}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={140}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) =>
                                percent > 0.04 ? `${(percent * 100).toFixed(0)}%` : ''
                            }
                            labelLine={false}
                        >
                            {chartData.map((_, index) => (
                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#0f172a',
                                border: '1px solid #1e293b',
                                borderRadius: '8px',
                                padding: '10px 14px',
                            }}
                            itemStyle={{ color: '#cbd5e1', fontSize: '12px' }}
                            formatter={(value: number, name: string) => [
                                `${value} (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`,
                                name,
                            ]}
                        />
                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            wrapperStyle={{
                                paddingTop: 30,
                                fontSize: 11,
                                color: '#94a3b8',
                            }}
                            formatter={(value) => value.length > 20 ? value.slice(0, 18) + '…' : value}
                        />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
