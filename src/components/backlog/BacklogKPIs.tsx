import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Package, Clock, AlertTriangle, Flame, Trophy, Database } from 'lucide-react';
import { BacklogItem, BacklogDailyKPI } from '@/hooks/useBacklogData';

interface BacklogKPIsProps {
    data: BacklogItem[];
    yesterdayCount: number | null;
    dailyKPI?: BacklogDailyKPI | null;
}

function KPICard({
    icon: Icon,
    label,
    value,
    sub,
    color = 'text-foreground',
    bgColor = 'bg-secondary/30',
    badge,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    sub?: React.ReactNode;
    color?: string;
    bgColor?: string;
    badge?: React.ReactNode;
}) {
    return (
        <div className={`glass rounded-xl p-4 flex flex-col gap-2 ${bgColor}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    <Icon className="h-4 w-4" />
                    {label}
                </div>
                {badge}
            </div>
            {value !== '' && <div className={`text-3xl font-bold ${color}`}>{value}</div>}
            {sub && <div className="text-sm text-muted-foreground">{sub}</div>}
        </div>
    );
}

export function BacklogKPIs({ data, yesterdayCount, dailyKPI }: BacklogKPIsProps) {
    const stats = useMemo(() => {
        // When dailyKPI is present, use persisted values for the 4 main metrics
        const total = dailyKPI ? dailyKPI.total_backlog : data.length;
        const idadeMedia = dailyKPI
            ? Math.round(dailyKPI.idade_media ?? 0)
            : data.length > 0
                ? Math.round(data.reduce((acc, d) => acc + (d.dias_em_aberto ?? 0), 0) / data.length)
                : 0;
        const acima30 = dailyKPI ? dailyKPI.acima_30 : data.filter(d => (d.dias_em_aberto ?? 0) > 30).length;
        const acima50 = dailyKPI ? dailyKPI.acima_50 : data.filter(d => (d.dias_em_aberto ?? 0) > 50).length;

        // Top 5 projects by count (always from raw data — live view)
        const projMap: Record<string, number> = {};
        data.forEach(d => {
            const key = d.nome_projeto || d.codigo_projeto || 'N/A';
            projMap[key] = (projMap[key] || 0) + 1;
        });
        const top5 = Object.entries(projMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        // Variation vs yesterday
        let deltaAbs: number | null = null;
        let deltaPct: number | null = null;
        if (yesterdayCount !== null) {
            deltaAbs = total - yesterdayCount;
            deltaPct = yesterdayCount > 0 ? Math.round((deltaAbs / yesterdayCount) * 100) : null;
        }

        return { total, idadeMedia, acima30, acima50, top5, deltaAbs, deltaPct };
    }, [data, yesterdayCount, dailyKPI]);

    const variationNode = useMemo(() => {
        if (stats.deltaAbs === null) return <span className="text-muted-foreground">Sem snapshot de ontem</span>;
        const isUp = stats.deltaAbs > 0;
        const isFlat = stats.deltaAbs === 0;
        const color = isFlat ? 'text-muted-foreground' : isUp ? 'text-red-400' : 'text-green-400';
        const Icon = isFlat ? Minus : isUp ? TrendingUp : TrendingDown;
        return (
            <span className={`flex items-center gap-1 text-xl ${color}`}>
                <Icon className="h-4 w-4" />
                {isUp ? '+' : ''}{stats.deltaAbs} chamados
                {stats.deltaPct !== null && ` (${isUp ? '+' : ''}${stats.deltaPct}%)`}
            </span>
        );
    }, [stats]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Backlog Total — custom card with Hoje/Ontem */}
            <div className="glass rounded-xl p-4 flex flex-col gap-2 bg-primary/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wide">
                        <Package className="h-4 w-4" />
                        Backlog Total
                    </div>
                    {dailyKPI && <span title="Fonte: backlog_total_diario"><Database className="h-3 w-3 text-primary/50" /></span>}
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">{stats.total.toLocaleString('pt-BR')}</span>
                    <span className="text-xs font-medium text-primary/60 tracking-wide">hoje</span>
                </div>
                {yesterdayCount !== null && (
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-semibold text-orange-400">{yesterdayCount.toLocaleString('pt-BR')}</span>
                        <span className="text-xs tracking-wide text-orange-400/70">ontem</span>
                    </div>
                )}
            </div>
            <KPICard
                icon={stats.deltaAbs !== null && stats.deltaAbs > 0 ? TrendingUp : TrendingDown}
                label="Variação vs Ontem"
                value=''
                sub={variationNode}
            />
            <KPICard
                icon={Clock}
                label="Idade Média"
                value={`${stats.idadeMedia} dias`}
                color={stats.idadeMedia > 30 ? 'text-red-400' : stats.idadeMedia > 10 ? 'text-yellow-400' : 'text-green-400'}
                badge={dailyKPI && <span title="Fonte: backlog_total_diario"><Database className="h-3 w-3 text-primary/50" /></span>}
            />
            <KPICard
                icon={AlertTriangle}
                label="Backlog > 30 dias"
                value={stats.acima30.toLocaleString('pt-BR')}
                color={stats.acima30 > 0 ? 'text-orange-400' : 'text-green-400'}
                bgColor={stats.acima30 > 0 ? 'bg-orange-500/10' : 'bg-secondary/30'}
                badge={dailyKPI && <span title="Fonte: backlog_total_diario"><Database className="h-3 w-3 text-primary/50" /></span>}
            />
            <KPICard
                icon={Flame}
                label="Backlog > 50 dias"
                value={stats.acima50.toLocaleString('pt-BR')}
                color={stats.acima50 > 0 ? 'text-red-400' : 'text-green-400'}
                bgColor={stats.acima50 > 0 ? 'bg-red-500/10' : 'bg-secondary/30'}
                badge={dailyKPI && <span title="Fonte: backlog_total_diario"><Database className="h-3 w-3 text-primary/50" /></span>}
            />
            <div className="glass rounded-xl p-4 flex flex-col gap-2 bg-secondary/30">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    <Trophy className="h-4 w-4" />
                    Top 5 Projetos
                </div>
                <div className="space-y-1">
                    {stats.top5.map(([proj, count]) => (
                        <div key={proj} className="flex items-center justify-between text-xs">
                            <span className="text-foreground truncate max-w-[120px]" title={proj}>{proj}</span>
                            <span className="font-bold text-primary ml-2">{count}</span>
                        </div>
                    ))}
                    {stats.top5.length === 0 && <span className="text-muted-foreground text-xs">Sem dados</span>}
                </div>
            </div>
        </div>
    );
}
