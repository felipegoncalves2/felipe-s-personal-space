import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { CauseImpact } from '@/hooks/useSLAAnalysis';

interface RootCauseChartsProps {
    causes: {
        motivos: CauseImpact[];
        categorias: CauseImpact[];
        incidentes: CauseImpact[];
        divisoes: CauseImpact[];
        slaPorUf: CauseImpact[];
    };
}

const COLORS = ['#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6'];

export function RootCauseCharts({ causes }: RootCauseChartsProps) {
    const hasCategorias = causes.categorias.length > 0;
    const hasIncidentes = causes.incidentes.length > 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico 1 — Perda de SLA por CATEGORIA */}
                <div className="glass rounded-xl p-6 h-[400px] flex flex-col">
                    <h3 className="text-lg font-bold text-foreground mb-1">Perda de SLA por Categoria</h3>
                    <p className="text-xs text-muted-foreground mb-6">Distribuição operacional consolidada (Mês Corrente)</p>

                    {hasCategorias ? (
                        <ResponsiveContainer width="100%" height="80%">
                            <BarChart data={causes.categorias} margin={{ bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    fontSize={10}
                                    interval={0}
                                    angle={-15}
                                    textAnchor="end"
                                    tick={{ fill: 'rgba(148, 163, 184, 0.8)' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    fontSize={10}
                                    tick={{ fill: 'rgba(148, 163, 184, 0.8)' }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                    contentStyle={{
                                        background: '#0f172a',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        color: '#ffffff',
                                        padding: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                    }}
                                    labelStyle={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '4px' }}
                                    itemStyle={{ color: '#ffffff' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30}>
                                    {causes.categorias.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex-1 flex items-center justify-center border border-dashed border-white/5 rounded-lg bg-white/5">
                            <p className="text-xs text-muted-foreground italic text-center px-4">
                                Nenhuma perda de SLA registrada no mês de Fevereiro.
                            </p>
                        </div>
                    )}
                </div>

                {/* Gráfico 2 — SLA por UF */}
                <div className="glass rounded-xl p-6 h-[400px] flex flex-col">
                    <h3 className="text-lg font-bold text-foreground mb-1">SLA por UF</h3>
                    <p className="text-xs text-muted-foreground mb-6">Desempenho regional consolidado (Percentual dentro do SLA)</p>

                    {causes.slaPorUf.length > 0 ? (
                        <ResponsiveContainer width="100%" height="80%">
                            <BarChart data={causes.slaPorUf} margin={{ bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    fontSize={10}
                                    tick={{ fill: 'rgba(148, 163, 184, 0.8)' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    fontSize={10}
                                    domain={[0, 100]}
                                    tick={{ fill: 'rgba(148, 163, 184, 0.8)' }}
                                    tickFormatter={(val) => `${val}%`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        const data = payload[0].payload;
                                        const slaColor = data.value < 80 ? '#f43f5e' : data.value < 95 ? '#eab308' : '#22c55e';
                                        return (
                                            <div style={{
                                                background: '#0f172a',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '6px',
                                                padding: '10px 14px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                                color: '#ffffff',
                                                fontSize: '12px',
                                                lineHeight: '1.6'
                                            }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>{data.name}</div>
                                                <div>SLA: <span style={{ color: slaColor, fontWeight: 'bold' }}>{data.value.toFixed(2)}%</span></div>
                                                <div>Total: {data.total ?? '—'} chamados</div>
                                                <div>Perdidos: {data.lost ?? '—'}</div>
                                            </div>
                                        );
                                    }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                                    {causes.slaPorUf.map((entry, index) => {
                                        // The data is sorted ascending, so the first one is the worst
                                        const isWorst = index === 0;
                                        return (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={isWorst ? '#f43f5e' : '#6366f1'}
                                            />
                                        );
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex-1 flex items-center justify-center border border-dashed border-white/5 rounded-lg bg-white/5">
                            <p className="text-xs text-muted-foreground italic text-center px-4">
                                Sem registros regionais no período atual.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
