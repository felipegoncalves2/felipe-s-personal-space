import { useState, useEffect, useCallback } from 'react';
import { MonitoringData } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { calculateTrend, TrendDirection } from '@/components/common/TrendIndicator';
import { detectAnomaly, calculateComparison } from '@/lib/statistics';
import { subDays } from 'date-fns';

const SUPABASE_URL = 'https://qromvrzqktrfexbnaoem.supabase.co';
const SESSION_KEY = 'techub_session';
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useMonitoringData() {
  const [data, setData] = useState<MonitoringData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const storedSession = localStorage.getItem(SESSION_KEY);
      let sessionToken = '';

      if (storedSession) {
        try {
          const parsed = JSON.parse(storedSession);
          sessionToken = parsed.session_token;
        } catch { }
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/get-monitoring-data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
      });

      const result = await response.json();

      if (result.success) {
        // Fetch history for stats calculation (last 7 days)
        const startDate = subDays(new Date(), 8).toISOString(); // Fetch slightly more to be safe

        const { data: rawHistory, error: dbError } = await supabase
          .from('monitoramento_parque')
          .select('*')
          .gte('data_gravacao', startDate)
          .order('data_gravacao', { ascending: false });

        if (dbError) {
          console.error('Error fetching history data for stats:', dbError);
          setData(result.data.map((item: MonitoringData) => ({
            ...item,
            trend: 'stable' as TrendDirection,
            anomaly: false,
            comparison: { diffPercent: 0, label: 'N/A' }
          })));
        } else {
          // Group by empresa
          const recordsByEmpresa = new Map<string, Array<typeof rawHistory[0]>>();

          for (const record of rawHistory || []) {
            if (!recordsByEmpresa.has(record.empresa)) {
              recordsByEmpresa.set(record.empresa, []);
            }
            recordsByEmpresa.get(record.empresa)!.push(record);
          }

          // Calculate stats for each empresa
          const dataWithStats: MonitoringData[] = result.data.map((item: MonitoringData) => {
            const records = recordsByEmpresa.get(item.empresa) || [];

            // Calculate current percentage
            const currentBase = parseInt(records[0]?.total_base) || item.total_base || 0;
            const currentSem = parseInt(records[0]?.total_sem_monitoramento) || item.total_sem_monitoramento || 0;
            const currentMonitoradas = currentBase - currentSem;
            const currentPercentual = currentBase > 0 ? (currentMonitoradas / currentBase) * 100 : item.percentual;

            // Trend calculation (vs previous record)
            let trend: TrendDirection = 'stable';
            if (records.length >= 2) {
              const prevRecord = records[1];
              const prevBase = parseInt(prevRecord.total_base) || 0;
              const prevSem = parseInt(prevRecord.total_sem_monitoramento) || 0;
              const prevMonitoradas = prevBase - prevSem;
              const prevPercentual = prevBase > 0 ? (prevMonitoradas / prevBase) * 100 : 0;
              trend = calculateTrend(currentPercentual, prevPercentual);
            }

            // Anomaly & Comparison (vs 7 days history)
            // Extract history as DataPoint[] for statistics functions
            const historyDataPoints = records.map(r => {
              const b = parseInt(r.total_base) || 0;
              const s = parseInt(r.total_sem_monitoramento) || 0;
              return {
                date: r.data_gravacao,
                value: b > 0 ? ((b - s) / b) * 100 : 0
              };
            });

            // Exclude current value from history for "past" comparison
            const pastValues = historyDataPoints.slice(1);

            const isAnomaly = detectAnomaly(pastValues, currentPercentual);
            const comparison = calculateComparison(currentPercentual, pastValues);

            return {
              ...item,
              trend,
              anomaly: isAnomaly,
              comparison
            };
          });

          setData(dataWithStats);
        }
        setLastUpdated(new Date());
      } else {
        setError(result.error || 'Erro ao carregar dados');
      }
    } catch (err) {
      console.error('Fetch monitoring data error:', err);
      setError('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, isLoading, error, lastUpdated, refetch: fetchData };
}
