import { motion } from 'framer-motion';
import { Users, CheckCircle2, XCircle, Bell, AlertTriangle, Target } from 'lucide-react';
import { SLAAnalysisKPIs } from '@/hooks/useSLAAnalysis';

interface AnalysisKPIsProps {
    kpis: SLAAnalysisKPIs;
    loading: boolean;
}

export function AnalysisKPIs({ kpis, loading }: AnalysisKPIsProps) {
    const cards = [
        {
            label: 'Total de Chamados',
            value: kpis?.totalTickets ?? 0,
            icon: Users,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10'
        },
        {
            label: '% SLA Atendido',
            value: kpis ? `${kpis.slaPercentage.toFixed(1)}%` : '---',
            icon: CheckCircle2,
            color: 'text-green-500',
            bgColor: 'bg-green-500/10'
        },
        {
            label: 'Fora do SLA',
            value: kpis?.outsideSLA ?? 0,
            icon: XCircle,
            color: 'text-red-500',
            bgColor: 'bg-red-500/10'
        },
        {
            label: 'Total de Alertas',
            value: kpis?.totalAlerts ?? 0,
            icon: Bell,
            color: 'text-orange-500',
            bgColor: 'bg-orange-500/10'
        },
        {
            label: 'Anomalias',
            value: kpis?.anomalies ?? 0,
            icon: AlertTriangle,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10'
        },
        {
            label: 'Top Motivo (Perda)',
            value: kpis?.topCriticalItem || '---',
            icon: Target,
            color: 'text-rose-500',
            bgColor: 'bg-rose-500/10',
            subValue: 'Maior causa de desvio no SLA'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {cards.map((card, index) => (
                <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass rounded-xl p-4 flex flex-col justify-between"
                >
                    <div className="flex items-start justify-between">
                        <div className={`p-2 rounded-lg ${card.bgColor}`}>
                            <card.icon className={`h-5 w-5 ${card.color}`} />
                        </div>
                    </div>
                    <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {card.label}
                        </p>
                        <div className="flex items-baseline gap-2">
                            <h3 className={`text-xl font-bold truncate ${loading ? 'animate-pulse' : ''}`}>
                                {loading ? '---' : card.value}
                            </h3>
                        </div>
                        {card.subValue && (
                            <p className="text-[10px] text-muted-foreground mt-1 truncate">
                                {card.subValue}
                            </p>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
