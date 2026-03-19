import { useState } from 'react';
import { RefreshCw, Package, Clock, History, LayoutDashboard, AlertCircle } from 'lucide-react';
import { useBacklogData } from '@/hooks/useBacklogData';
import { BacklogKPIs } from '@/components/backlog/BacklogKPIs';
import { BacklogAgingChart } from '@/components/backlog/BacklogAgingChart';
import { BacklogFluxoChart } from '@/components/backlog/BacklogFluxoChart';
import { BacklogDistribuicao } from '@/components/backlog/BacklogDistribuicao';
import { BacklogHeatmap } from '@/components/backlog/BacklogHeatmap';
import { BacklogTable } from '@/components/backlog/BacklogTable';
import { BacklogFiltersPanel } from '@/components/backlog/BacklogFilters';
import { BacklogHistorico } from '@/components/backlog/BacklogHistorico';
import { BacklogIntradiarioKPIs } from '@/components/backlog/BacklogIntradiarioKPIs';
import { BacklogVariacaoDiariaChart } from '@/components/backlog/BacklogVariacaoDiariaChart';
import { BacklogFluxoOperacionalChart } from '@/components/backlog/BacklogFluxoOperacionalChart';
import { useFluxoOperacional } from '@/hooks/useFluxoOperacional';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ViewMode = 'realtime' | 'historico';

function SectionCard({
    title,
    description,
    children,
    className = ""
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`glass rounded-xl border border-border/50 p-6 space-y-4 ${className}`}>
            <div>
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
                {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
            </div>
            {children}
        </div>
    );
}

function SkeletonBlock({ height = 'h-48' }: { height?: string }) {
    return (
        <div className={`${height} bg-secondary/30 rounded-xl animate-pulse`} />
    );
}

export function BacklogPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('realtime');
    const {
        filteredData,
        yesterdayCount,
        dailyKPI,
        loading,
        error,
        lastUpdated,
        refetch,
        filters,
        setFilters,
        filterOptions,
        intradiaryStats,
        historicalIntradiary
    } = useBacklogData();

    const {
        data: fluxoData,
        loading: fluxoLoading,
        error: fluxoError
    } = useFluxoOperacional();

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        Backlog Operacional
                        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Live Sync</span>
                        </div>
                    </h1>
                    <p className="text-muted-foreground mt-1">Gestão de chamados, aging e performance do parque</p>
                </div>

                <div className="flex items-center gap-3 bg-secondary/30 p-1 rounded-lg border border-border/50 self-start md:self-center">
                    <button
                        onClick={() => setViewMode('realtime')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300 text-sm font-medium ${viewMode === 'realtime' ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-primary/10 text-muted-foreground'}`}
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Realtime
                    </button>
                    <button
                        onClick={() => setViewMode('historico')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300 text-sm font-medium ${viewMode === 'historico' ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-primary/10 text-muted-foreground'}`}
                    >
                        <History className="h-4 w-4" />
                        Histórico
                    </button>
                </div>
            </header>

            {viewMode === 'historico' ? (
                <BacklogHistorico />
            ) : (
                <>
                    <div className="flex justify-between items-center bg-secondary/10 p-4 rounded-xl border border-border/50">
                        <div className="flex items-center gap-4">
                            <div className="text-sm">
                                <span className="text-muted-foreground">Última atualização:</span>
                                <span className="ml-2 font-mono font-bold text-primary">
                                    {lastUpdated ? format(lastUpdated, "HH:mm:ss") : "--:--:--"}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={refetch}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 hover:bg-secondary border border-border/50 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-primary' : ''}`} />
                            <span className="text-sm font-medium">Atualizar Agora</span>
                        </button>
                    </div>

                    {error && (
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
                            <AlertCircle className="h-5 w-5" />
                            <p>{error}</p>
                        </div>
                    )}

                    <BacklogFiltersPanel
                        filters={filters}
                        setFilters={setFilters}
                        options={filterOptions}
                    />

                    {/* KPIs Intradiários */}
                    <div className="mt-2">
                        <BacklogIntradiarioKPIs
                            currentBacklog={intradiaryStats.currentBacklog}
                            todayStart={intradiaryStats.todayStart}
                            todayVariation={intradiaryStats.todayVariation}
                            yesterdayStart={intradiaryStats.yesterdayStart}
                            yesterdayEnd={intradiaryStats.yesterdayEnd}
                            yesterdayVariation={intradiaryStats.yesterdayVariation}
                        />
                    </div>

                    {/* KPIs Principais */}
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} height="h-28" />)}
                        </div>
                    ) : (
                        <BacklogKPIs
                            data={filteredData}
                            yesterdayCount={yesterdayCount}
                            dailyKPI={dailyKPI}
                        />
                    )}

                    {/* Evolução da Variação e Aging */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <BacklogVariacaoDiariaChart data={historicalIntradiary} />
                        <SectionCard
                            title="📊 AGING de Chamados / FILA"
                            description="Volume de chamados por faixa de dias em aberto, agrupado por fila"
                        >
                            {loading ? <SkeletonBlock height="h-[430px]" /> : <BacklogAgingChart data={filteredData} />}
                        </SectionCard>
                    </div>

                    {/* Novo Fluxo Operacional do Mês */}
                    <SectionCard
                        title="📊 Fluxo Operacional do Mês"
                        description="Comparativo diário de chamados abertos vs. encerrados e evolução do saldo"
                    >
                        <BacklogFluxoOperacionalChart data={fluxoData} loading={fluxoLoading} />
                    </SectionCard>

                    {/* Aging Parado e Fluxo */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <SectionCard
                            title="🔴 AGING de Chamados / STATUS CLIENTE (PARADO)"
                            description="Somente chamados com status_cliente contendo 'Parado'"
                        >
                            {loading ? <SkeletonBlock height="h-[430px]" /> : (
                                <BacklogAgingChart data={filteredData} filterStatusCliente="Parado" />
                            )}
                        </SectionCard>

                        <SectionCard
                            title="📈 Fluxo Operacional"
                            description="Chamados abertos por dia e backlog acumulado"
                        >
                            {loading ? <SkeletonBlock height="h-[430px]" /> : <BacklogFluxoChart data={filteredData} />}
                        </SectionCard>
                    </div>

                    {/* Distribuição e Heatmap */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <SectionCard
                            title="🍩 Distribuição Atual"
                            description="Proporção do backlog por dimensão selecionada"
                        >
                            {loading ? <SkeletonBlock height="h-[430px]" /> : <BacklogDistribuicao data={filteredData} />}
                        </SectionCard>

                        <SectionCard
                            title="🔥 Heatmap Estratégico"
                            description="Fila × Faixa de dias — identifique gargalos rapidamente"
                        >
                            {loading ? <SkeletonBlock height="h-[430px]" /> : <BacklogHeatmap data={filteredData} />}
                        </SectionCard>
                    </div>

                    {/* Tabela Analítica */}
                    <SectionCard
                        title="📋 Tabela Analítica Completa"
                        description="Todos os chamados em aberto com busca, ordenação e exportação"
                    >
                        {loading ? <SkeletonBlock height="h-96" /> : <BacklogTable data={filteredData} />}
                    </SectionCard>
                </>
            )}
        </div>
    );
}
