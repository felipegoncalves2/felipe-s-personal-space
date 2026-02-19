import { useBacklogHistorico } from '@/hooks/useBacklogHistorico';
import { Calendar, Package, Clock, AlertTriangle, Flame, Database, BarChart2, TrendingUp } from 'lucide-react';
import { format as dateFormat } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    AreaChart, Area,
    BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useMemo } from 'react';

const FAIXA_COLORS: Record<string, string> = {
    '0-15 dias': '#22c55e',
    '16-30 dias': '#eab308',
    '31-50 dias': '#f97316',
    '51-90 dias': '#ef4444',
    '90+ dias': '#7f1d1d',
};

const darkTooltip = {
    contentStyle: {
        backgroundColor: '#0f172a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        fontSize: '12px',
    },
    labelStyle: { color: '#f1f5f9', fontWeight: 600 },
    itemStyle: { color: '#cbd5e1' },
    cursor: { fill: 'rgba(255,255,255,0.04)' },
};

function KPICard({ icon: Icon, label, value, color = 'text-foreground' }: {
    icon: React.ElementType;
    label: string;
    value: string;
    color?: string;
}) {
    return (
        <div className="glass rounded-xl p-4 flex flex-col gap-2 bg-secondary/30">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wide">
                <Icon className="h-4 w-4" />
                {label}
            </div>
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
        </div>
    );
}

function formatDateLabel(dateStr: string) {
    try {
        return dateFormat(new Date(dateStr + 'T12:00:00'), 'dd/MM', { locale: ptBR });
    } catch {
        return dateStr;
    }
}

function formatDateFull(dateStr: string) {
    try {
        return dateFormat(new Date(dateStr + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
        return dateStr;
    }
}

export function BacklogHistorico() {
    const { data, loading, error, dateFrom, dateTo, handleRangeChange } = useBacklogHistorico();

    const today = dateFormat(new Date(), 'yyyy-MM-dd');

    // Build evolution chart data
    const evoData = useMemo(() =>
        data.evolution.map(d => ({
            date: formatDateLabel(d.data_ref),
            'Total': d.total_backlog,
            '> 30 dias': d.acima_30,
            '> 50 dias': d.acima_50,
            'Idade Média': Math.round(d.idade_media ?? 0),
        })),
        [data.evolution]
    );

    // Build aging chart data
    const agingChartData = useMemo(() => {
        const map: Record<string, Record<string, number>> = {};
        data.aging.forEach(row => {
            if (!map[row.fila]) map[row.fila] = {};
            map[row.fila][row.faixa_dias] = row.total_chamados;
        });
        return Object.entries(map).map(([fila, faixas]) => ({ fila, ...faixas }));
    }, [data.aging]);

    const faixas = ['0-15 dias', '16-30 dias', '31-50 dias', '51-90 dias', '90+ dias'];

    const hasData = data.evolution.length > 0 || data.aging.length > 0 || data.snapshot.length > 0;

    return (
        <div className="space-y-6">
            {/* Date Range Selector */}
            <div className="glass rounded-xl border border-border/50 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-start gap-3 flex-1">
                        <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-foreground">Selecione uma Data</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Dados de Histórico do Backlog</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground font-medium">Data início</label>
                            <input
                                type="date"
                                max={dateTo}
                                value={dateFrom}
                                onChange={e => handleRangeChange(e.target.value, dateTo)}
                                className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 [color-scheme:dark]"
                            />
                        </div>
                        <span className="text-muted-foreground text-sm mt-4">→</span>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground font-medium">Data fim</label>
                            <input
                                type="date"
                                max={today}
                                min={dateFrom}
                                value={dateTo}
                                onChange={e => handleRangeChange(dateFrom, e.target.value)}
                                className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 [color-scheme:dark]"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="space-y-4">
                    <div className="h-64 bg-secondary/30 rounded-xl animate-pulse" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-24 bg-secondary/30 rounded-xl animate-pulse" />
                        ))}
                    </div>
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="glass rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                    ⚠️ {error}
                </div>
            )}

            {/* No data */}
            {!loading && !error && !hasData && (
                <div className="glass rounded-xl border border-border/50 p-12 text-center">
                    <Database className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="text-muted-foreground text-sm">Nenhum dado histórico encontrado para o período selecionado</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Os snapshots são gerados automaticamente a cada atualização do backlog</p>
                </div>
            )}

            {!loading && !error && hasData && (
                <>
                    {/* EVOLUTION CHART */}
                    {evoData.length > 0 && (
                        <div className="glass rounded-xl border border-border/50 p-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground">Evolução do Backlog</h3>
                                    <p className="text-xs text-muted-foreground">Total e aging ao longo do período selecionado</p>
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={evoData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="grad30" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="grad50" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                    <Tooltip {...darkTooltip} />
                                    <Legend
                                        verticalAlign="bottom"
                                        wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 12 }}
                                    />
                                    <Area type="monotone" dataKey="Total" stroke="#22c55e" strokeWidth={2} fill="url(#gradTotal)" dot={{ r: 3, fill: '#22c55e' }} />
                                    <Area type="monotone" dataKey="> 30 dias" stroke="#f97316" strokeWidth={2} fill="url(#grad30)" dot={{ r: 3, fill: '#f97316' }} />
                                    <Area type="monotone" dataKey="> 50 dias" stroke="#ef4444" strokeWidth={2} fill="url(#grad50)" dot={{ r: 3, fill: '#ef4444' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* KPIs — latest date with data */}
                    {data.latestKPI && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Database className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-semibold text-foreground">
                                    KPIs de {formatDateFull(data.latestKPI.data_ref)}
                                </h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <KPICard icon={Package} label="Total Backlog" value={data.latestKPI.total_backlog.toLocaleString('pt-BR')} color="text-primary" />
                                <KPICard icon={Clock} label="Idade Média" value={`${Math.round(data.latestKPI.idade_media ?? 0)} dias`}
                                    color={data.latestKPI.idade_media > 30 ? 'text-red-400' : 'text-yellow-400'} />
                                <KPICard icon={AlertTriangle} label="Acima 30 dias" value={data.latestKPI.acima_30.toLocaleString('pt-BR')}
                                    color={data.latestKPI.acima_30 > 0 ? 'text-orange-400' : 'text-green-400'} />
                                <KPICard icon={Flame} label="Acima 50 dias" value={data.latestKPI.acima_50.toLocaleString('pt-BR')}
                                    color={data.latestKPI.acima_50 > 0 ? 'text-red-400' : 'text-green-400'} />
                            </div>
                        </div>
                    )}

                    {/* Aging Chart */}
                    {agingChartData.length > 0 && (
                        <div className="glass rounded-xl border border-border/50 p-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <BarChart2 className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-semibold text-foreground">
                                    AGING por Fila — {data.latestKPI ? formatDateFull(data.latestKPI.data_ref) : dateTo}
                                </h3>
                            </div>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={agingChartData} margin={{ top: 10, right: 20, left: 0, bottom: 120 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="fila" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                    <Tooltip {...darkTooltip} />
                                    <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 60, fontSize: 12, color: '#94a3b8' }} />
                                    {faixas.map(faixa => (
                                        <Bar key={faixa} dataKey={faixa} stackId="a" fill={FAIXA_COLORS[faixa]} barSize={30} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Snapshot Table */}
                    {data.snapshot.length > 0 && (
                        <div className="glass rounded-xl border border-border/50 p-6 space-y-4">
                            <h3 className="text-sm font-semibold text-foreground">
                                Detalhamento de Chamados ({data.snapshot.length} registros)
                            </h3>
                            <div className="overflow-auto max-h-96">
                                <table className="w-full text-xs">
                                    <thead className="sticky top-0 bg-background/90 backdrop-blur">
                                        <tr className="border-b border-border/50">
                                            <th className="text-left py-2 px-3 text-muted-foreground">Chamado</th>
                                            <th className="text-left py-2 px-3 text-muted-foreground">Fila</th>
                                            <th className="text-left py-2 px-3 text-muted-foreground">Dias</th>
                                            <th className="text-left py-2 px-3 text-muted-foreground">Status</th>
                                            <th className="text-left py-2 px-3 text-muted-foreground">Status Cliente</th>
                                            <th className="text-left py-2 px-3 text-muted-foreground">Empresa</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.snapshot.map((row, idx) => (
                                            <tr key={idx} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                                                <td className="py-2 px-3 font-mono text-primary">{row.numero_chamado}</td>
                                                <td className="py-2 px-3 text-foreground">{row.fila ?? '—'}</td>
                                                <td className="py-2 px-3">
                                                    <span className={`font-bold ${(row.dias_em_aberto ?? 0) > 50 ? 'text-red-400' : (row.dias_em_aberto ?? 0) > 30 ? 'text-orange-400' : 'text-foreground'}`}>
                                                        {row.dias_em_aberto ?? '—'}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 text-muted-foreground">{row.status ?? '—'}</td>
                                                <td className="py-2 px-3 text-muted-foreground">{row.status_cliente ?? '—'}</td>
                                                <td className="py-2 px-3 text-muted-foreground truncate max-w-[140px]">{row.empresa_nome ?? '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
