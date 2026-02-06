import { motion } from 'framer-motion';
import { Type, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { SLAAnalysisKPIs } from '@/hooks/useSLAAnalysis';

interface ExecutiveSummaryProps {
    kpis: SLAAnalysisKPIs | null;
    type: 'fila' | 'projetos';
}

export function ExecutiveSummary({ kpis, type }: ExecutiveSummaryProps) {
    if (!kpis) return null;

    const isExcellent = kpis.slaPercentage >= 95;
    const isAttention = kpis.slaPercentage >= 85 && kpis.slaPercentage < 95;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-6 border-l-4 border-primary"
        >
            <div className="flex items-center gap-2 mb-3">
                <Type className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Resumo Executivo Automático</h3>
            </div>

            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                <p>
                    No período analisado, o SLA médio para {type === 'fila' ? 'Filas RN' : 'Projetos RN'} é de <span className="font-bold text-foreground">{kpis.slaPercentage.toFixed(1)}%</span>.
                    A performance geral é considerada <span className={`font-bold ${isExcellent ? 'text-green-500' : isAttention ? 'text-yellow-500' : 'text-red-500'}`}>
                        {isExcellent ? 'Excelente' : isAttention ? 'Estável' : 'Critica'}
                    </span>.
                </p>

                <p>
                    Foram detectados <span className="font-bold text-foreground">{kpis.totalAlerts} alertas</span> no total,
                    sendo <span className="font-bold text-foreground">{kpis.anomalies} anomalias estatísticas</span>.
                    {kpis.anomalies > 0 ? ' Recomenda-se atenção especial às anomalias, pois representam desvios do padrão histórico esperado.' : ''}
                </p>

                <p>
                    O principal ofensor identificado no período foi <span className="font-bold text-primary">{kpis.topCriticalItem}</span>,
                    com <span className="font-bold text-foreground">{kpis.topCriticalCount} chamados perdidos</span>.
                    No período analisado, o total de SLA Perdido considerando todas as {type === 'fila' ? 'filas' : 'projetos'} foi de <span className="font-bold text-foreground">{kpis.outsideSLA} chamados</span>.
                </p>
            </div>
        </motion.div>
    );
}
