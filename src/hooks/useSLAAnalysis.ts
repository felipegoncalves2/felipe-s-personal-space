import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, subDays, format, startOfDay } from 'date-fns';
import { MonitoringAlert } from '@/types';

export interface SLAAnalysisKPIs {
    totalTickets: number;
    slaPercentage: number;
    outsideSLA: number;
    totalAlerts: number;
    anomalies: number;
    topCriticalItem: string;
}

export interface HistoricalPoint {
    timestamp: string; // Start of the day
    min: number;
    max: number;
    avg: number;
    hasAnomaly: boolean;
    alerts?: MonitoringAlert[];
}

export interface CauseImpact {
    name: string;
    value: number;
}

export function useSLAAnalysis(type: 'fila' | 'projetos') {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [kpis, setKpis] = useState<SLAAnalysisKPIs | null>(null);
    const [history, setHistory] = useState<HistoricalPoint[]>([]);
    const [causes, setCauses] = useState<{
        motivos: CauseImpact[];
        categorias: CauseImpact[];
        incidentes: CauseImpact[];
        divisoes: CauseImpact[];
    }>({ motivos: [], categorias: [], incidentes: [], divisoes: [] });
    const [detailedData, setDetailedData] = useState<any[]>([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const now = new Date();
            const startDateStr = startOfMonth(now).toISOString();
            const endDateStr = now.toISOString();

            // 1. Fetch Detailed Data (Source of truth for causes and KPIs)
            // Note: We filter by created_at as requested for the visibility window
            const { data: rawDetailed, error: detailedError } = await supabase
                .from('sla_detalhado_rn' as any)
                .select('*')
                .gte('created_at', startDateStr)
                .lte('created_at', endDateStr);

            if (detailedError) throw detailedError;

            // Filter by type
            const filteredDetailed = type === 'fila'
                ? (rawDetailed as any[]).filter(d => d.fila)
                : (rawDetailed as any[]).filter(d => d.nome_projeto);

            // 2. Fetch History Snapshots (Sources 2 & 3)
            const historyTable = type === 'fila' ? 'sla_fila_rn' : 'sla_projetos_rn';
            const { data: rawHistory, error: historyError } = await supabase
                .from(historyTable as any)
                .select('*')
                .gte('created_at', startDateStr)
                .lte('created_at', endDateStr)
                .order('created_at', { ascending: true });

            if (historyError) throw historyError;

            // 3. Fetch Alerts
            const alertType: any = type === 'fila' ? 'sla_fila' : 'sla_projeto';
            const { data: rawAlerts, error: alertsError } = await supabase
                .from('monitoring_alerts')
                .select('*')
                .eq('tipo_monitoramento', alertType)
                .gte('detected_at', startDateStr);

            if (alertsError) throw alertsError;

            // --- KPIs (Directly from detailed) ---
            const totalTickets = filteredDetailed.length;
            const lostTickets = filteredDetailed.filter((d: any) => d.sla_perdido === 'Sim').length;
            const slaPercentage = totalTickets > 0 ? ((totalTickets - lostTickets) / totalTickets) * 100 : 0;
            const totalAlerts = rawAlerts?.length || 0;
            const anomaliesCount = (rawAlerts as any[])?.filter(a => a.alert_type === 'anomalia').length || 0;

            const itemCounts: Record<string, number> = {};
            filteredDetailed.forEach((d: any) => {
                if (d.sla_perdido === 'Sim') {
                    const id = type === 'fila' ? d.fila : d.nome_projeto;
                    if (id) {
                        itemCounts[id] = (itemCounts[id] || 0) + 1;
                    }
                }
            });
            const topCriticalItem = Object.entries(itemCounts)
                .sort(([, a], [, b]) => b - a)[0]?.[0] || '---';

            setKpis({
                totalTickets,
                slaPercentage,
                outsideSLA: lostTickets,
                totalAlerts,
                anomalies: anomaliesCount,
                topCriticalItem
            });

            // --- DAILY RANGE AGGREGATION (From Snapshots) ---
            const daySnapshots: Record<string, number[]> = {};

            (rawHistory as any[] || []).forEach(h => {
                const date = new Date(h.created_at);
                const dateKey = format(date, 'yyyy-MM-dd');
                const val = typeof h.percentual === 'string' ? parseFloat(h.percentual) : h.percentual;

                if (!daySnapshots[dateKey]) daySnapshots[dateKey] = [];
                daySnapshots[dateKey].push(val);
            });

            const historyPoints: HistoricalPoint[] = Object.entries(daySnapshots).map(([dateKey, values]) => {
                const min = Math.min(...values);
                const max = Math.max(...values);
                const avg = values.reduce((a, b) => a + b, 0) / values.length;

                const dayStart = startOfDay(new Date(dateKey + 'T00:00:00'));
                const dayEnd = new Date(dateKey + 'T23:59:59');

                const alertDay = (rawAlerts as any[] || []).filter(a => {
                    const ad = new Date(a.detected_at);
                    return ad >= dayStart && ad <= dayEnd;
                });

                const hasAnomaly = alertDay.some(a => a.alert_type === 'anomalia');

                return {
                    timestamp: dayStart.toISOString(),
                    min: parseFloat(min.toFixed(1)),
                    max: parseFloat(max.toFixed(1)),
                    avg: parseFloat(avg.toFixed(1)),
                    hasAnomaly,
                    alerts: alertDay
                };
            }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            setHistory(historyPoints);

            // --- CAUSES MAPPING ---
            const getCounts = (field: string, onlyLostSLA: boolean = true) => {
                const counts: Record<string, number> = {};
                filteredDetailed.forEach((d: any) => {
                    if (!onlyLostSLA || d.sla_perdido === 'Sim') {
                        const val = d[field] || 'Não informado';
                        counts[val] = (counts[val] || 0) + 1;
                    }
                });
                return Object.entries(counts)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value);
            };

            setCauses({
                motivos: getCounts('motivo_perda_sla').slice(0, 10),
                categorias: getCounts('categoria_perda_sla'),
                incidentes: getCounts('tipo_incidente', false),
                divisoes: getCounts('divisao_perda_sla')
            });

            setDetailedData(filteredDetailed);

        } catch (err: any) {
            console.error('Error fetching SLA analysis:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [type]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { loading, error, kpis, history, causes, detailedData, refetch: fetchData };
}
