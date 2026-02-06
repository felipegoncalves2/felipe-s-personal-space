import { useState, useEffect, useCallback } from 'react';
import { SLAData } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { calculateTrend, TrendDirection } from '@/components/common/TrendIndicator';
import { persistAlert } from '@/lib/alerts';

type SLAType = 'fila' | 'projetos';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useSLAData(type: SLAType) {
  const [data, setData] = useState<SLAData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      if (!lastUpdated) setIsLoading(true);
      setError(null);

      const tableName = type === 'fila' ? 'sla_fila_rn' : 'sla_projetos_rn';
      const monitorType = type === 'fila' ? 'sla_fila' : 'sla_projeto';

      // 1. Fetch SLA data
      const { data: rawData, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // 2. Fetch active alerts from DB (Source of Truth for Display)
      const { data: activeAlerts, error: alertsError } = await supabase
        .from('monitoring_alerts')
        .select('*')
        .eq('tipo_monitoramento', monitorType)
        .eq('tratado', false);

      if (alertsError) console.error('Error fetching active alerts:', alertsError);

      // Group records by name and get latest + previous
      const recordsByName = new Map<string, Array<any>>();

      for (const record of rawData || []) {
        const name = type === 'fila'
          ? (record as { nome_fila: string }).nome_fila
          : (record as { nome_projeto: string }).nome_projeto;

        if (!recordsByName.has(name)) {
          recordsByName.set(name, []);
        }

        const records = recordsByName.get(name)!;
        if (records.length < 2) {
          records.push(record);
        }
      }

      // Transform to SLAData format
      const processedData: SLAData[] = Array.from(recordsByName.entries()).map(([name, records]) => {
        const current = records[0];
        const previous = records[1];

        const dentro = current.dentro || 0;
        const fora = current.fora || 0;
        const total = dentro + fora;
        const percentual = total > 0 ? Number(((dentro / total) * 100).toFixed(2)) : 0;

        // Calculate variation
        let variation = 0;
        let prevPercentual = null;
        if (previous) {
          const prevDentro = previous.dentro || 0;
          const prevFora = previous.fora || 0;
          const prevTotal = prevDentro + prevFora;
          prevPercentual = prevTotal > 0 ? (prevDentro / prevTotal) * 100 : 0;
          variation = percentual - prevPercentual;
        }

        // LOCAL DETECTION for persistence
        let localTrend = calculateTrend(percentual, prevPercentual);

        // PERSIST new alerts
        if (localTrend === 'down') {
          persistAlert({
            tipo_monitoramento: monitorType,
            identificador_item: name,
            alert_type: 'tendencia',
            severity: 'warning',
            percentual_atual: percentual,
            contexto: { trend: localTrend }
          });
        }

        if (percentual < 80) {
          persistAlert({
            tipo_monitoramento: monitorType,
            identificador_item: name,
            alert_type: 'limite',
            severity: 'critical',
            percentual_atual: percentual,
            contexto: { reason: 'Percentual abaixo do limite de 80%' }
          });
        }

        // DISPLAY state: Merge with current ACTIVE alerts in DB
        const itemAlerts = activeAlerts?.filter(a => a.identificador_item === name) || [];

        return {
          id: current.id,
          nome: name,
          dentro,
          fora,
          total,
          percentual,
          trend: itemAlerts.some(a => a.alert_type === 'tendencia') ? 'down' : (variation > 0 ? 'up' : 'stable'),
          variation,
          created_at: current.created_at
        };
      });

      setData(processedData);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error(`Fetch SLA ${type} data error:`, err);
      setError('Erro ao carregar dados de SLA');
    } finally {
      setIsLoading(false);
    }
  }, [type, refreshKey]);

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
