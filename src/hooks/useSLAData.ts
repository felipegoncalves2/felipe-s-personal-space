import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SLAData } from '@/types';

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
      const nameField = type === 'fila' ? 'nome_fila' : 'nome_projeto';

      // Fetch all records ordered by created_at desc
      const { data: rawData, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Get the latest record for each fila/projeto
      const latestRecords = new Map<string, typeof rawData[0]>();
      
      for (const record of rawData || []) {
        const name = type === 'fila' 
          ? (record as { nome_fila: string }).nome_fila 
          : (record as { nome_projeto: string }).nome_projeto;
        
        if (!latestRecords.has(name)) {
          latestRecords.set(name, record);
        }
      }

      // Transform to SLAData format with calculated percentual
      const processedData: SLAData[] = Array.from(latestRecords.values()).map((record) => {
        const dentro = record.dentro || 0;
        const fora = record.fora || 0;
        const total = dentro + fora;
        const percentual = total > 0 ? Number(((dentro / total) * 100).toFixed(2)) : 0;
        
        const nome = type === 'fila' 
          ? (record as { nome_fila: string }).nome_fila 
          : (record as { nome_projeto: string }).nome_projeto;

        return {
          id: record.id,
          nome,
          dentro,
          fora,
          total,
          percentual,
          created_at: record.created_at,
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
