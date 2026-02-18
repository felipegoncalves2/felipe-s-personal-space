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

      const monitorType = type === 'fila' ? 'sla_fila' : 'sla_projeto';
      const mvName = type === 'fila' ? 'mv_sla_fila_rn' : 'mv_sla_projetos_rn';

      // 1. Fetch SLA data from Materialized View
      const { data: mvData, error: fetchError } = await supabase
        .from(mvName as any)
        .select('*');

      if (fetchError) throw fetchError;

      // 2. Fetch active alerts from DB (Source of Truth for Display)
      const { data: activeAlerts, error: alertsError } = await supabase
        .from('monitoring_alerts')
        .select('*')
        .eq('tipo_monitoramento', monitorType)
        .eq('tratado', false);

      if (alertsError) console.error('Error fetching active alerts:', alertsError);

      // 2.5 Fetch custom metas
      const metaType = type === 'fila' ? 'fila' : 'projeto';
      const { data: customMetas, error: metasError } = await supabase
        .from('sla_metas' as any)
        .select('*');

      if (metasError) console.error('Error fetching custom metas:', metasError);

      // Group metas by identifier
      const metasByIdentifier = new Map<string, any>();
      for (const meta of (customMetas as any[]) || []) {
        metasByIdentifier.set(meta.identificador, meta);
      }

      // Transform to SLAData format
      const processedData: SLAData[] = (mvData || []).map((record: any, index: number) => {
        const name = type === 'fila' ? record.fila : record.nome_projeto;

        // MV data is already aggregated and prepared
        const dentro = Number(record.dentro || 0);
        const fora = Number(record.fora || 0);
        const total = Number(record.total || 0);
        const percentual = Number(record.percentual || 0);

        // Get custom metas or fallback
        const meta = metasByIdentifier.get(name);
        const metaExcelente = meta?.meta_excelente ?? 98;
        const metaAtencao = meta?.meta_atencao ?? 80;

        if (percentual < metaAtencao) {
          persistAlert({
            tipo_monitoramento: monitorType,
            identificador_item: name,
            alert_type: 'limite',
            severity: 'critical',
            percentual_atual: percentual,
            contexto: { reason: `Percentual abaixo da meta de atenção de ${metaAtencao}%` }
          });
        }

        // DISPLAY state: Merge with current ACTIVE alerts in DB
        const itemAlerts = activeAlerts?.filter(a => a.identificador_item === name) || [];

        // Note: Trend and Variation are not available in the monthly snapshot MV
        // We rely on active alerts for 'trend' overrides if needed

        return {
          id: index, // MV doesn't have a stable ID, using index for key
          nome: name,
          dentro,
          fora,
          total,
          percentual,
          trend: itemAlerts.some(a => a.alert_type === 'tendencia') ? 'down' : 'stable',
          variation: 0,
          created_at: new Date().toISOString(), // Snapshot time
          meta_excelente: metaExcelente,
          meta_atencao: metaAtencao
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
