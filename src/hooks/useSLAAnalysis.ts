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
            const startDateStr = startOfMonth(now).toISOString().split('T')[0];
            const endDateStr = now.toISOString().split('T')[0];

            // 1. Fetch Aggregated KPIs, Causes, and History via RPC (MASSIVE EGRESS REDUCTION)
            const { data: rawRpcData, error: rpcError } = await (supabase.rpc as any)('get_monthly_sla_kpis', {
                p_tipo: type,
                p_start_date: startDateStr,
                p_end_date: endDateStr
            });

            if (rpcError) throw rpcError;

            const rpcData: any = rawRpcData;

            // 2. Fetch Alerts (For anomalies)
            const alertType: any = type === 'fila' ? 'sla_fila' : 'sla_projeto';
            const { data: rawAlerts, error: alertsError } = await supabase
                .from('monitoring_alerts')
                .select('*')
                .eq('tipo_monitoramento', alertType)
                .gte('detected_at', startOfMonth(now).toISOString());

            if (alertsError) throw alertsError;

            // Apply alerts & anomalies to the RPC history data
            const historyPoints: HistoricalPoint[] = (rpcData.history || []).map((h: any) => {
                const dayStr = h.timestamp.split('T')[0];
                const dayAlerts = (rawAlerts || []).filter(a => a.detected_at.startsWith(dayStr));
                return {
                    timestamp: h.timestamp,
                    min: h.min,
                    max: h.max,
                    avg: h.avg,
                    hasAnomaly: dayAlerts.some(a => a.alert_type === 'anomalia'),
                    alerts: dayAlerts
                };
            });

            // Set Aggregated State
            setKpis({
                totalTickets: rpcData.kpis.totalTickets,
                slaPercentage: rpcData.kpis.slaPercentage,
                outsideSLA: rpcData.kpis.lostTickets,
                totalAlerts: rawAlerts?.length || 0,
                anomalies: (rawAlerts || []).filter(a => a.alert_type === 'anomalia').length,
                topCriticalItem: rpcData.kpis.topCriticalItem,
                topCriticalCount: rpcData.kpis.topCriticalCount
            });

            setHistory(historyPoints);
            setCauses(rpcData.causes);

            // 3. Fetch Detailed Data (Paginated - max 200 items to save egress)
            // Users should use server-side search if they need more, but recent 200 is usually enough for visual check
            let query = supabase
                .from('sla_detalhado_rn' as any)
                .select('*')
                .gte('data_criacao', startOfMonth(now).toISOString())
                .lte('data_criacao', now.toISOString())
                .order('data_criacao', { ascending: false })
                .limit(200);

            if (type === 'fila') {
                query = query.not('fila', 'is', null).neq('fila', '');
            } else {
                query = query.not('nome_projeto', 'is', null).neq('nome_projeto', '');
            }

            const { data: detailedData, error: detailedError } = await query;

            if (detailedError) throw detailedError;

            setDetailedData(detailedData || []);

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
