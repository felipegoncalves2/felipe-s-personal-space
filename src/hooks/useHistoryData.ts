import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type HistoryType = 'mps' | 'sla_fila' | 'sla_projetos';

export interface HistoryDataPoint {
    date: string; // DD/MM
    fullDate: string; // YYYY-MM-DD
    percentual: number;
}

interface UseHistoryDataProps {
    type: HistoryType;
    identifier: string; // empresa name or fila/projeto name
    isOpen: boolean;
}

export function useHistoryData({ type, identifier, isOpen }: UseHistoryDataProps) {
    return useQuery({
        queryKey: ['history', type, identifier],
        queryFn: async () => {
            console.log('Fetching history for:', type, identifier);

            const endDate = new Date();
            const startDate = subDays(endDate, 15);

            let queryBuilder;

            if (type === 'mps') {
                queryBuilder = supabase
                    .from('monitoramento_parque')
                    .select('data_gravacao, total_base, total_sem_monitoramento')
                    .eq('empresa', identifier)
                    .gte('data_gravacao', startDate.toISOString())
                    .order('data_gravacao', { ascending: true });
            } else if (type === 'sla_fila') {
                queryBuilder = supabase
                    .from('sla_fila_rn')
                    .select('created_at, dentro, fora')
                    .eq('nome_fila', identifier)
                    .gte('created_at', startDate.toISOString())
                    .order('created_at', { ascending: true });
            } else {
                queryBuilder = supabase
                    .from('sla_projetos_rn')
                    .select('created_at, dentro, fora')
                    .eq('nome_projeto', identifier)
                    .gte('created_at', startDate.toISOString())
                    .order('created_at', { ascending: true });
            }

            const { data, error } = await queryBuilder;

            if (error) {
                console.error('Error fetching history:', error);
                throw error;
            }

            // Group by day to handle multiple snapshots per day (taking the last one or average? User said "snapshot do dia")
            // We will take the latest entry for each day to represent the day's status
            const dailyMap = new Map<string, HistoryDataPoint>();

            data?.forEach((item) => {
                const timestamp = type === 'mps' ? item.data_gravacao : item.created_at;
                const dateObj = new Date(timestamp);
                const dateKey = format(dateObj, 'yyyy-MM-dd');

                let percentual = 0;

                if (type === 'mps') {
                    // MPS logic might need total_base and total_sem_monitoramento, but existing code uses percentage column?
                    // Wait, existing types.ts says monitoramento_parque has no percentage column, but DonutChart receives percentage.
                    // Let's re-read MonitoringGrid.tsx to see how it calculates percentage.
                    // Ah, MonitoringGrid uses useMonitoringData hook. Let's check that if needed.
                    // But checking types.ts again: monitoramento_parque columns are id, empresa, total_base, total_sem_monitoramento, data_gravacao.
                    // So percentage must be calculated.
                    const total = Number(item.total_base) || 1; // avoid division by zero
                    // Logic commonly used: monitored = total_base - total_sem_monitoramento
                    // percentual = (monitored / total_base) * 100
                    // monitoring_parque columns are TEXT according to types.ts (string), valid validation needed.
                    const totalBase = parseInt(item.total_base as string) || 0;
                    const semMonitoramento = parseInt(item.total_sem_monitoramento as string) || 0;
                    const monitored = Math.max(0, totalBase - semMonitoramento);
                    percentual = totalBase > 0 ? (monitored / totalBase) * 100 : 0;

                } else {
                    // SLA logic: (dentro / (dentro + fora)) * 100
                    const dentro = Number(item.dentro);
                    const fora = Number(item.fora);
                    const total = dentro + fora;
                    percentual = total > 0 ? (dentro / total) * 100 : 0;
                }

                // Always update with the latest record for that day (since we ordered by date ASC)
                // Or should we group? The query is ordered by date ASC so the last one for a day is the latest.
                dailyMap.set(dateKey, {
                    date: format(dateObj, 'dd/MM'),
                    fullDate: dateKey,
                    percentual: parseFloat(percentual.toFixed(2))
                });
            });

            return Array.from(dailyMap.values());
        },
        enabled: isOpen && !!identifier,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
