import { useState, useEffect, useCallback } from 'react';
import { MonitoringData } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { calculateTrend, TrendDirection } from '@/components/common/TrendIndicator';

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
        } catch {}
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
        // Fetch previous data for trend calculation
        const { data: rawData, error: dbError } = await supabase
          .from('monitoramento_parque')
          .select('*')
          .order('data_gravacao', { ascending: false });

        if (dbError) {
          console.error('Error fetching trend data:', dbError);
          setData(result.data.map((item: MonitoringData) => ({ ...item, trend: 'stable' as TrendDirection })));
        } else {
          // Group by empresa and get latest + previous
          const recordsByEmpresa = new Map<string, Array<typeof rawData[0]>>();
          
          for (const record of rawData || []) {
            if (!recordsByEmpresa.has(record.empresa)) {
              recordsByEmpresa.set(record.empresa, []);
            }
            const records = recordsByEmpresa.get(record.empresa)!;
            if (records.length < 2) {
              records.push(record);
            }
          }

          // Calculate trends for each empresa
          const dataWithTrends: MonitoringData[] = result.data.map((item: MonitoringData) => {
            const records = recordsByEmpresa.get(item.empresa);
            let trend: TrendDirection = 'stable';
            
            if (records && records.length >= 2) {
              const current = records[0];
              const previous = records[1];
              
              const currentBase = parseInt(current.total_base) || 0;
              const currentSem = parseInt(current.total_sem_monitoramento) || 0;
              const currentMonitoradas = currentBase - currentSem;
              const currentPercentual = currentBase > 0 ? (currentMonitoradas / currentBase) * 100 : 0;
              
              const prevBase = parseInt(previous.total_base) || 0;
              const prevSem = parseInt(previous.total_sem_monitoramento) || 0;
              const prevMonitoradas = prevBase - prevSem;
              const prevPercentual = prevBase > 0 ? (prevMonitoradas / prevBase) * 100 : 0;
              
              trend = calculateTrend(currentPercentual, prevPercentual);
            }
            
            return { ...item, trend };
          });

          setData(dataWithTrends);
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
