import { useState, useEffect, useCallback } from 'react';
import { MonitoringData } from '@/types';

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
        setData(result.data);
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
