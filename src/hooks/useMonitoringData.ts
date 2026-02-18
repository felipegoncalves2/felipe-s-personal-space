import { useState, useEffect, useCallback } from 'react';
import { MonitoringData } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { calculateTrend, TrendDirection } from '@/components/common/TrendIndicator';
import { detectAnomaly, calculateComparison, DataPoint } from '@/lib/statistics';
import { subDays } from 'date-fns';
import { persistAlert } from '@/lib/alerts';

const SUPABASE_URL = 'https://qromvrzqktrfexbnaoem.supabase.co';
const SESSION_KEY = 'techub_session';
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useMonitoringData() {
  const [data, setData] = useState<MonitoringData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      if (!lastUpdated) setIsLoading(true);
      setError(null);

      const storedSession = localStorage.getItem(SESSION_KEY);
      let sessionToken = '';

      if (storedSession) {
        try {
          const parsed = JSON.parse(storedSession);
          sessionToken = parsed.session_token;
        } catch { }
      }

      // 1. Fetch main data
      const response = await fetch(`${SUPABASE_URL}/functions/v1/get-monitoring-data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao carregar dados');
      }

      // 2. Fetch history for stats calculation (last 7 days)
      const startDate = subDays(new Date(), 8).toISOString();
      const { data: rawHistory, error: dbError } = await supabase
        .from('monitoramento_parque')
        .select('*')
        .gte('data_gravacao', startDate)
        .order('data_gravacao', { ascending: false });

      if (dbError) throw dbError;

      // 3. Fetch active alerts from DB (Source of Truth for Display)
      const { data: activeAlerts, error: alertsError } = await supabase
        .from('monitoring_alerts')
        .select('*')
        .eq('tipo_monitoramento', 'mps')
        .eq('tratado', false);

      if (alertsError) console.error('Error fetching active alerts:', alertsError);

      // 3.5 Fetch custom metas
      const { data: customMetas, error: metasError } = await supabase
        .from('sla_metas' as any)
        .select('*')
        .eq('tipo', 'mps');

      if (metasError) console.error('Error fetching custom metas:', metasError);

      // Group metas by identifier
      const metasByIdentifier = new Map<string, any>();
      for (const meta of (customMetas as any[]) || []) {
        metasByIdentifier.set(meta.identificador, meta);
      }
      const recordsByEmpresa = new Map<string, Array<any>>();
      for (const record of rawHistory || []) {
        if (!recordsByEmpresa.has(record.empresa)) {
          recordsByEmpresa.set(record.empresa, []);
        }
        recordsByEmpresa.get(record.empresa)!.push(record);
      }

      // 4. Enrich and Filter
      const enrichedData: MonitoringData[] = result.data.map((item: MonitoringData) => {
        const records = recordsByEmpresa.get(item.empresa) || [];

        // Map history to DataPoints
        const historyPoints: DataPoint[] = records.map(r => {
          const b = parseInt(r.total_base) || 0;
          const s = parseInt(r.total_sem_monitoramento) || 0;
          return {
            date: r.data_gravacao,
            value: b > 0 ? ((b - s) / b) * 100 : 0
          };
        });

        // Current value
        const currentBase = parseInt(records[0]?.total_base) || item.total_base || 0;
        const currentSem = parseInt(records[0]?.total_sem_monitoramento) || item.total_sem_monitoramento || 0;
        const currentPercentual = currentBase > 0 ? ((currentBase - currentSem) / currentBase) * 100 : item.percentual;

        // Previous value for variation calculation
        const prevRecord = records[1];
        let previousPercentual = null;
        if (prevRecord) {
          const prevBase = parseInt(prevRecord.total_base) || 0;
          const prevSem = parseInt(prevRecord.total_sem_monitoramento) || 0;
          previousPercentual = prevBase > 0 ? ((prevBase - prevSem) / prevBase) * 100 : 0;
        }

        const variation = previousPercentual !== null ? currentPercentual - previousPercentual : 0;

        // LOCAL DETECTION for persistence
        const pastPoints = historyPoints.slice(1);
        const localTrend = calculateTrend(currentPercentual, previousPercentual);
        const isAnomaly = detectAnomaly(pastPoints, currentPercentual);
        const comparison = calculateComparison(currentPercentual, pastPoints);

        // PERSIST new alerts
        if (isAnomaly) {
          persistAlert({
            tipo_monitoramento: 'mps',
            identificador_item: item.empresa,
            alert_type: 'anomalia',
            severity: 'critical',
            percentual_atual: Number(currentPercentual.toFixed(2)),
            contexto: { comparison }
          });
        }

        if (localTrend === 'down') {
          persistAlert({
            tipo_monitoramento: 'mps',
            identificador_item: item.empresa,
            alert_type: 'tendencia',
            severity: 'warning',
            percentual_atual: Number(currentPercentual.toFixed(2)),
            contexto: { trend: localTrend }
          });
        }

        // Get custom metas or fallback
        const meta = metasByIdentifier.get(item.empresa);
        const metaExcelente = meta?.meta_excelente ?? 98;
        const metaAtencao = meta?.meta_atencao ?? 80;

        if (currentPercentual < metaAtencao) {
          persistAlert({
            tipo_monitoramento: 'mps',
            identificador_item: item.empresa,
            alert_type: 'limite',
            severity: 'critical',
            percentual_atual: Number(currentPercentual.toFixed(2)),
            contexto: { reason: `Percentual abaixo da meta de atenção de ${metaAtencao}%` }
          });
        }

        // DISPLAY state: Merge with current ACTIVE alerts in DB
        const itemAlerts = activeAlerts?.filter(a => a.identificador_item === item.empresa) || [];

        return {
          ...item,
          percentual: currentPercentual,
          trend: itemAlerts.some(a => a.alert_type === 'tendencia') ? 'down' : (variation > 0 ? 'up' : 'stable'),
          anomaly: itemAlerts.some(a => a.alert_type === 'anomalia'),
          comparison,
          variation,
          meta_excelente: metaExcelente,
          meta_atencao: metaAtencao
        };
      });

      setData(enrichedData);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Fetch monitoring data error:', err);
      setError(err.message || 'Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  }, [refreshKey]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData, refreshKey]);

  const refetch = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return { data, isLoading, error, lastUpdated, refetch };
}
