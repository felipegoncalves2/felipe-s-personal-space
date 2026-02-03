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
                                    contentStyle={{
                                        background: '#0f172a',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                        color: '#cbd5e1'
                                    }}
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

                {/* Gráfico 2 — Incidentes por TIPO */}
                <div className="glass rounded-xl p-6 h-[400px] flex flex-col">
                    <h3 className="text-lg font-bold text-foreground mb-1">Incidentes por Tipo</h3>
                    <p className="text-xs text-muted-foreground mb-6">Volume total de chamados por natureza (Contexto)</p>

                    {hasIncidentes ? (
                        <ResponsiveContainer width="100%" height="80%">
                            <BarChart data={causes.incidentes} margin={{ bottom: 20 }}>
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
                                    tick={{ fill: 'rgba(148, 163, 184, 0.8)' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: '#0f172a',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                        color: '#cbd5e1'
                                    }}
                                />
                                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex-1 flex items-center justify-center border border-dashed border-white/5 rounded-lg bg-white/5">
                            <p className="text-xs text-muted-foreground italic text-center px-4">
                                Sem registros de incidentes no período atual.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
