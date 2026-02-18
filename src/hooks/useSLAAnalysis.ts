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
    topCriticalCount: number;
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
    total?: number;
    lost?: number;
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
        slaPorUf: CauseImpact[];
    }>({ motivos: [], categorias: [], incidentes: [], divisoes: [], slaPorUf: [] });
    const [detailedData, setDetailedData] = useState<any[]>([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const now = new Date();
            const startDateStr = startOfMonth(now).toISOString();
            const endDateStr = now.toISOString();

            // 1. Fetch Detailed Data
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

            // 2. Fetch History Snapshots
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

            // --- KPIs ---
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
            const topEntry = Object.entries(itemCounts)
                .sort(([, a], [, b]) => b - a)[0];

            const topCriticalItem = topEntry?.[0] || '---';
            const topCriticalCount = topEntry?.[1] || 0;

            setKpis({
                totalTickets,
                slaPercentage,
                outsideSLA: lostTickets,
                totalAlerts,
                anomalies: anomaliesCount,
                topCriticalItem,
                topCriticalCount
            });

            // --- DAILY RANGE AGGREGATION (CUMULATIVE MONTH-TO-DATE) ---
            // Instead of RPC snapshots, we calculate cumulative SLA for each day of the month
            const daysInMonth: Date[] = [];
            let currentDay = startOfDay(new Date(startDateStr));
            const today = startOfDay(new Date());

            while (currentDay <= today) {
                daysInMonth.push(new Date(currentDay));
                currentDay.setDate(currentDay.getDate() + 1);
            }

            const historyPoints: HistoricalPoint[] = daysInMonth.map(day => {
                const dayEnd = new Date(day);
                dayEnd.setHours(23, 59, 59, 999);

                // Cumulative tickets: all tickets created on or before this day (within the month)
                const cumulativeTickets = filteredDetailed.filter((d: any) => {
                    const ticketDate = new Date(d.created_at);
                    return ticketDate <= dayEnd;
                });

                const total = cumulativeTickets.length;
                const lost = cumulativeTickets.filter((d: any) => d.sla_perdido === 'Sim').length;
                const percent = total > 0 ? Number(((total - lost) / total * 100).toFixed(2)) : 100;

                // Alerts for this specific day (for anomalies/markers)
                const alertDay = (rawAlerts as any[] || []).filter(a => {
                    const ad = new Date(a.detected_at);
                    return ad >= day && ad <= dayEnd;
                });

                return {
                    timestamp: day.toISOString(),
                    min: percent, // Showing single line, so min=max=avg
                    max: percent,
                    avg: percent,
                    hasAnomaly: alertDay.some(a => a.alert_type === 'anomalia'),
                    alerts: alertDay
                };
            });

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

            // SLA by UF Calculation
            const ufStats: Record<string, { total: number, lost: number }> = {};
            filteredDetailed.forEach((d: any) => {
                const uf = d.uf || 'Ignorado';
                if (!ufStats[uf]) ufStats[uf] = { total: 0, lost: 0 };
                ufStats[uf].total += 1;
                if (d.sla_perdido === 'Sim') ufStats[uf].lost += 1;
            });

            const slaPorUf = Object.entries(ufStats).map(([name, stats]) => ({
                name,
                value: parseFloat((((stats.total - stats.lost) / stats.total) * 100).toFixed(2)),
                total: stats.total,
                lost: stats.lost
            })).sort((a, b) => a.value - b.value);

            setCauses({
                motivos: getCounts('motivo_perda_sla').slice(0, 10),
                categorias: getCounts('categoria_perda_sla'),
                incidentes: getCounts('tipo_incidente', false),
                divisoes: getCounts('divisao_perda_sla'),
                slaPorUf
            });

            setDetailedData(filteredDetailed);

            const filterData = (search: string, project?: string, fila?: string) => {
                let result = [...filteredDetailed];

                if (search) {
                    const lowSearch = search.toLowerCase();
                    result = result.filter(d =>
                        (d.numero_referencia?.toLowerCase().includes(lowSearch)) ||
                        (d.observacao_perda_sla?.toLowerCase().includes(lowSearch)) ||
                        (d.nome_projeto?.toLowerCase().includes(lowSearch)) ||
                        (d.fila?.toLowerCase().includes(lowSearch))
                    );
                }

                if (project && project !== 'all') {
                    result = result.filter(d => d.nome_projeto === project);
                }

                if (fila && fila !== 'all') {
                    result = result.filter(d => d.fila === fila);
                }

                return result;
            };

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
