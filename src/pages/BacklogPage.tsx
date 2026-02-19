import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Package, Clock, History, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBacklogData } from '@/hooks/useBacklogData';
import { BacklogKPIs } from '@/components/backlog/BacklogKPIs';
import { BacklogAgingChart } from '@/components/backlog/BacklogAgingChart';
import { BacklogOrigemChart } from '@/components/backlog/BacklogOrigemChart';
import { BacklogFluxoChart } from '@/components/backlog/BacklogFluxoChart';
import { BacklogDistribuicao } from '@/components/backlog/BacklogDistribuicao';
import { BacklogHeatmap } from '@/components/backlog/BacklogHeatmap';
import { BacklogTable } from '@/components/backlog/BacklogTable';
import { BacklogFiltersPanel } from '@/components/backlog/BacklogFilters';
import { BacklogHistorico } from '@/components/backlog/BacklogHistorico';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ViewMode = 'realtime' | 'historico';

function SectionCard({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="glass rounded-xl border border-border/50 p-6 space-y-4">
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
    } = useBacklogData();

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Package className="h-6 w-6 text-primary" />
                        Backlog Operacional
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Painel analítico estratégico de backlog
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1 bg-secondary/30 rounded-lg p-1">
                        <Button
                            variant={viewMode === 'realtime' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('realtime')}
                            className="gap-2 h-8"
                        >
                            <Activity className="h-3.5 w-3.5" />
                            Tempo Real
                        </Button>
                        <Button
                            variant={viewMode === 'historico' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('historico')}
                            className="gap-2 h-8"
                        >
                            <History className="h-3.5 w-3.5" />
                            Histórico
                        </Button>
                    </div>

                    {viewMode === 'realtime' && (
                        <>
                            {lastUpdated && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Clock className="h-3.5 w-3.5" />
                                    Atualizado em {format(lastUpdated, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </div>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={refetch}
                                disabled={loading}
                                className="gap-2"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                Atualizar
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Histórico View */}
            {viewMode === 'historico' && <BacklogHistorico />}

            {/* Realtime View */}
            {viewMode === 'realtime' && (
                <>
                    {/* Error */}
                    {error && (
                        <div className="glass rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Global Filters */}
                    <BacklogFiltersPanel
                        filters={filters}
                        setFilters={setFilters}
                        options={filterOptions}
                    />

                    {/* BLOCO 1 — KPIs */}
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} height="h-28" />)}
                        </div>
                    ) : (
                        <BacklogKPIs data={filteredData} yesterdayCount={yesterdayCount} dailyKPI={dailyKPI} />
                    )}

                    {/* BLOCO 2 — Aging Chart Geral */}
                    <SectionCard
                        title="📊 AGING de Chamados / FILA"
                        description="Volume de chamados por faixa de dias em aberto, agrupado por fila"
                    >
                        {loading ? <SkeletonBlock height="h-[620px]" /> : <BacklogAgingChart data={filteredData} />}
                    </SectionCard>

                    {/* BLOCO 2B — Aging Chart PARADO */}
                    <SectionCard
                        title="🔴 AGING de Chamados / STATUS CLIENTE (PARADO)"
                        description="Somente chamados com status_cliente contendo 'Parado' — identifique risco operacional imediato"
                    >
                        {loading ? <SkeletonBlock height="h-[620px]" /> : (
                            <BacklogAgingChart data={filteredData} filterStatusCliente="Parado" />
                        )}
                    </SectionCard>

                    {/* BLOCO 3 — Fluxo */}
                    <SectionCard
                        title="📈 Fluxo Operacional"
                        description="Chamados abertos por dia e backlog acumulado"
                    >
                        {loading ? <SkeletonBlock height="h-[520px]" /> : <BacklogFluxoChart data={filteredData} />}
                    </SectionCard>

                    {/* BLOCO 5 + 6 — Distribuição e Heatmap */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <SectionCard
                            title="🍩 Distribuição Atual"
                            description="Proporção do backlog por dimensão selecionada"
                        >
                            {loading ? <SkeletonBlock height="h-[520px]" /> : <BacklogDistribuicao data={filteredData} />}
                        </SectionCard>

                        <SectionCard
                            title="🔥 Heatmap Estratégico"
                            description="Fila × Faixa de dias — identifique gargalos rapidamente"
                        >
                            {loading ? <SkeletonBlock height="h-[520px]" /> : <BacklogHeatmap data={filteredData} />}
                        </SectionCard>
                    </div>

                    {/* BLOCO 7 — Tabela */}
                    <SectionCard
                        title="📋 Tabela Analítica Completa"
                        description="Todos os chamados em aberto com busca, ordenação e exportação"
                    >
                        {loading ? <SkeletonBlock height="h-96" /> : <BacklogTable data={filteredData} />}
                    </SectionCard>
                </>
            )}
        </motion.div>
    );
}
