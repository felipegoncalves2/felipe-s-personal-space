import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { BacklogItem, FAIXAS_DIAS } from '@/hooks/useBacklogData';

interface BacklogAgingChartProps {
    data: BacklogItem[];
    /** If set, only include items where status_cliente matches this value */
    filterStatusCliente?: string;
}

const FAIXA_COLORS: Record<string, string> = {
    'Até 3 dias': '#16a34a', // verde forte
    '4 a 5 dias': '#84cc16', // verde claro
    '6 a 10 dias': '#eab308', // amarelo
    '11 a 30 dias': '#f97316', // laranja
    '31 a 50 dias': '#ef4444', // vermelho
    'Acima de 50 dias': '#7f1d1d', // vermelho escuro
};

const FAIXA_LABELS = FAIXAS_DIAS.map(f => f.label);

function getFaixa(dias: number | null): string {
    if (dias === null) return 'Sem info';
    if (dias <= 3) return 'Até 3 dias';
    if (dias <= 5) return '4 a 5 dias';
    if (dias <= 10) return '6 a 10 dias';
    if (dias <= 30) return '11 a 30 dias';
    if (dias <= 50) return '31 a 50 dias';
    return 'Acima de 50 dias';
}

const TOOLTIP_STYLE = {
    background: '#0f172a',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#e2e8f0',
};

export function BacklogAgingChart({ data, filterStatusCliente }: BacklogAgingChartProps) {
    const filtered = useMemo(() => {
        if (!filterStatusCliente) return data;
        const search = filterStatusCliente.trim().toLowerCase();
        return data.filter(d =>
            (d.status_cliente ?? '').trim().toLowerCase().includes(search)
        );
    }, [data, filterStatusCliente]);

    const { chartData, total, pctAcima30 } = useMemo(() => {
        const filaMap: Record<string, Record<string, number>> = {};
        filtered.forEach(item => {
            const fila = item.fila || 'Sem Fila';
            const faixa = getFaixa(item.dias_em_aberto);
            if (!filaMap[fila]) filaMap[fila] = {};
            filaMap[fila][faixa] = (filaMap[fila][faixa] || 0) + 1;
        });

        const rows = Object.entries(filaMap)
            .map(([fila, faixas]) => ({
                fila: fila.length > 22 ? fila.slice(0, 20) + '…' : fila,
                filaFull: fila,
                ...faixas,
                total: Object.values(faixas).reduce((a, b) => a + b, 0),
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 15);

        const total = filtered.length;
        const acima30 = filtered.filter(d => (d.dias_em_aberto ?? 0) > 30).length;
        const pctAcima30 = total > 0 ? Math.round((acima30 / total) * 100) : 0;

        return { chartData: rows, total, pctAcima30 };
    }, [filtered]);

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                Sem dados para exibir
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Summary stats */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                    Total: <strong className="text-foreground">{total.toLocaleString('pt-BR')} chamados</strong>
                </span>
                <span className={pctAcima30 > 20 ? 'text-red-400 font-semibold' : ''}>
                    {pctAcima30}% acima de 30 dias
                </span>
            </div>

            <ResponsiveContainer width="100%" height={600}>
                <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 180 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        dataKey="fila"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        angle={-35}
                        textAnchor="end"
                        interval={0}
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
                        itemStyle={{ color: '#cbd5e1', fontSize: '12px' }}
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{
                            paddingTop: 80,
                            fontSize: 12,
                            color: '#94a3b8',
                        }}
                    />
                    {FAIXA_LABELS.map(label => (
                        <Bar
                            key={label}
                            dataKey={label}
                            stackId="a"
                            fill={FAIXA_COLORS[label]}
                            radius={[0, 0, 0, 0]}
                            barSize={30}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
