import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SLAData } from '@/types';
import { calculateTrend, TrendDirection } from '@/components/common/TrendIndicator';

type SLAType = 'fila' | 'projetos';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useSLAData(type: SLAType) {
  const [data, setData] = useState<SLAData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const tableName = type === 'fila' ? 'sla_fila_rn' : 'sla_projetos_rn';

      // Fetch all records ordered by created_at desc
      const { data: rawData, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Group records by name and get latest + previous
      const recordsByName = new Map<string, Array<typeof rawData[0]>>();
      
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

      // Transform to SLAData format with calculated percentual and trend
      const processedData: SLAData[] = Array.from(recordsByName.entries()).map(([name, records]) => {
        const current = records[0];
        const previous = records[1];
        
        const dentro = current.dentro || 0;
        const fora = current.fora || 0;
        const total = dentro + fora;
        const percentual = total > 0 ? Number(((dentro / total) * 100).toFixed(2)) : 0;
        
        // Calculate previous percentual for trend
        let trend: TrendDirection = 'stable';
        if (previous) {
          const prevDentro = previous.dentro || 0;
          const prevFora = previous.fora || 0;
          const prevTotal = prevDentro + prevFora;
          const prevPercentual = prevTotal > 0 ? Number(((prevDentro / prevTotal) * 100).toFixed(2)) : 0;
          trend = calculateTrend(percentual, prevPercentual);
        }

        return {
          id: current.id,
          nome: name,
          dentro,
          fora,
          total,
          percentual,
          created_at: current.created_at,
          trend,
        };
      });

      setData(processedData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(`Fetch SLA ${type} data error:`, err);
      setError('Erro ao carregar dados de SLA');
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, isLoading, error, lastUpdated, refetch: fetchData };
}
