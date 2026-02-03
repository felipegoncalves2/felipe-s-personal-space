import { motion } from 'framer-motion';
import { Bell, AlertTriangle, Zap, Clock, CheckCircle } from 'lucide-react';
import { MonitoringAlert } from '@/types';
import { useMemo } from 'react';

interface AlertSummaryCardsProps {
    alerts: MonitoringAlert[];
}

export function AlertSummaryCards({ alerts }: AlertSummaryCardsProps) {
    const stats = useMemo(() => {
        const active = alerts.filter(a => !a.tratado);
        const critical = active.filter(a => a.severity === 'critical');
        const today = alerts.filter(a => a.tratado && a.tratado_em && new Date(a.tratado_em).toDateString() === new Date().toDateString());

        // Types
        const byType = {
            limite: active.filter(a => a.alert_type === 'limite').length,
            anomalia: active.filter(a => a.alert_type === 'anomalia').length,
            tendencia: active.filter(a => a.alert_type === 'tendencia').length,
        };

        // Avg response time (simplified)
        const treated = alerts.filter(a => a.tratado && a.tratado_em);
        let avgMinutes = 0;
        if (treated.length > 0) {
            const totalDiff = treated.reduce((acc, a) => {
                const start = new Date(a.detected_at).getTime();
                const end = new Date(a.tratado_em!).getTime();
                return acc + (end - start);
            }, 0);
            avgMinutes = Math.round(totalDiff / treated.length / 1000 / 60);
        }

        return {
            active: active.length,
            critical: critical.length,
            byType,
            today: today.length,
            avgMinutes
        };
    }, [alerts]);

    const cards = [
        { label: 'Alertas Ativos', value: stats.active, icon: Bell, color: 'text-primary' },
        { label: 'Críticos', value: stats.critical, icon: AlertTriangle, color: 'text-chart-red' },
        { label: 'Limite', value: stats.byType.limite, icon: Zap, color: 'text-chart-yellow' },
        { label: 'Anomalia', value: stats.byType.anomalia, icon: Zap, color: 'text-orange-500' },
        { label: 'Tendência', value: stats.byType.tendencia, icon: Zap, color: 'text-blue-500' },
        { label: 'Tempo Médio', value: `${stats.avgMinutes} min`, icon: Clock, color: 'text-muted-foreground' },
        { label: 'Tratados Hoje', value: stats.today, icon: CheckCircle, color: 'text-chart-green' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {cards.map((card, index) => (
                <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass rounded-lg p-4 flex flex-col items-center justify-center text-center group hover:border-primary/50 transition-colors"
                >
                    <card.icon className={`h-5 w-5 ${card.color} mb-2 group-hover:scale-110 transition-transform`} />
                    <div className="text-xl font-bold text-foreground">{card.value}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 font-semibold">{card.label}</div>
                </motion.div>
            ))}
        </div>
    );
}
