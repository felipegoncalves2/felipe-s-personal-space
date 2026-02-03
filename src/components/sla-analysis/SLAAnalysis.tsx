import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSLAAnalysis } from '@/hooks/useSLAAnalysis';
import { AnalysisKPIs } from './AnalysisKPIs';
import { AlertLegend } from './AlertLegend';
import { SLAEvolutionChart } from './SLAEvolutionChart';
import { RootCauseCharts } from './RootCauseCharts';
import { DetailedSLATable } from './DetailedSLATable';
import { ExecutiveSummary } from './ExecutiveSummary';
import { HistoricalPoint } from '@/hooks/useSLAAnalysis';
import { AlertTriangle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function SLAAnalysis() {
    const [activeSubTab, setActiveSubTab] = useState<'fila' | 'projetos'>('fila');
    const [selectedPoint, setSelectedPoint] = useState<HistoricalPoint | null>(null);

    const { loading, error, kpis, history, causes: originalCauses, detailedData: originalDetailedData } = useSLAAnalysis(activeSubTab);

    // Filter data based on selectedPoint
    const filteredDetailedData = selectedPoint
        ? originalDetailedData.filter(d => {
            const itemDate = new Date(d.data_criacao).getTime();
            const pointDate = new Date(selectedPoint.timestamp).getTime();
            // Use a window of 30 minutes before and after the snapshot
            return Math.abs(itemDate - pointDate) < 1000 * 60 * 30;
        })
        : originalDetailedData;

    const getFilteredCounts = (data: any[], field: string) => {
        const counts: Record<string, number> = {};
        data.forEach(d => {
            if (d.sla_perdido === 'Sim') {
                const val = d[field] || 'Não informado';
                counts[val] = (counts[val] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    };

    const filteredCauses = (selectedPoint as any)
        ? {
            motivos: getFilteredCounts(filteredDetailedData, 'motivo_perda_sla'),
            categorias: getFilteredCounts(filteredDetailedData, 'categoria_perda_sla'),
            incidentes: getFilteredCounts(filteredDetailedData, 'tipo_incidente'),
            divisoes: getFilteredCounts(filteredDetailedData, 'divisao_perda_sla')
        }
        : originalCauses;

    const handlePointClick = (point: HistoricalPoint | null) => {
        setSelectedPoint(point);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Análise de SLA</h2>
                    <p className="text-muted-foreground">
                        Inteligência corporativa e análise de causa raiz de SLA
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-blue-500/5 px-4 py-2 rounded-lg border border-blue-500/10">
                    <span className="text-[10px] uppercase font-bold text-blue-400 tracking-widest">
                        Exibindo Mês Corrente
                    </span>
                </div>
            </motion.div>

            <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as 'fila' | 'projetos')} className="space-y-6">
                <TabsList className="glass">
                    <TabsTrigger value="fila">Filas RN</TabsTrigger>
                    <TabsTrigger value="projetos">Projetos RN</TabsTrigger>
                </TabsList>

                <TabsContent value={activeSubTab} className="space-y-6 m-0 focus-visible:outline-none">
                    {/* Camada 1: KPIs Inteligentes */}
                    <AnalysisKPIs kpis={kpis!} loading={loading} />

                    {/* Camada 6: Contexto Executivo Automático (Apenas se houver perdas) */}
                    {kpis && kpis.outsideSLA > 0 && (
                        <div className="flex flex-col gap-4">
                            <ExecutiveSummary kpis={kpis} type={activeSubTab} />

                            {kpis.anomalies > 0 && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full w-fit cursor-help transition-all hover:bg-blue-500/20">
                                                <AlertTriangle className="h-3.5 w-3.5 text-blue-400" />
                                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                                                    Período com anomalia detectada
                                                </span>
                                                <Info className="h-3 w-3 text-blue-400/50" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="glass border-white/10 max-w-[250px]">
                                            <p className="text-xs leading-relaxed">
                                                Valor fora do padrão histórico, mesmo sem atingir limite crítico. Requer análise de contexto.
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    )}

                    {/* Camada 2: Legenda Educativa */}
                    <AlertLegend />

                    {/* Camada 3: Evolução Temporal */}
                    <SLAEvolutionChart
                        data={history}
                        onPointClick={handlePointClick}
                        selectedPoint={selectedPoint}
                    />

                    {/* Camada 4: Inteligência de Causa Raiz (Conditional inside) */}
                    <RootCauseCharts causes={filteredCauses} />

                    {/* Camada 5: Visão Operacional Detalhada */}
                    <DetailedSLATable data={filteredDetailedData} />
                </TabsContent>
            </Tabs>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                    Erro ao carregar análise de SLA: {error}
                </div>
            )}
        </div>
    );
}
