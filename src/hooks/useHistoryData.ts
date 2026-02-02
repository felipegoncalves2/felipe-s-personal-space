import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type HistoryType = 'mps' | 'sla_fila' | 'sla_projetos';
export type Granularity = 'daily' | 'hourly';

export interface HistoryDataPoint {
    date: string; // DD/MM or DD/MM HHh
    fullDate: string; // YYYY-MM-DD or ISO
    percentual: number;
}

interface UseHistoryDataProps {
    type: HistoryType;
    identifier: string; // empresa name or fila/projeto name
    isOpen: boolean;
    granularity?: Granularity;
}

export function useHistoryData({ type, identifier, isOpen, granularity = 'daily' }: UseHistoryDataProps) {
    return useQuery({
        queryKey: ['history', type, identifier, granularity],
        queryFn: async () => {
            console.log('Fetching history for:', type, identifier, granularity);

            const endDate = new Date();
            const daysToSubtract = granularity === 'hourly' ? 5 : 15;
            const startDate = subDays(endDate, daysToSubtract);

            let queryBuilder;

            // Determine table and timestamp column
            const table = type === 'mps' ? 'monitoramento_parque' :
                type === 'sla_fila' ? 'sla_fila_rn' : 'sla_projetos_rn';
            const timestampCol = type === 'mps' ? 'data_gravacao' : 'created_at';
            const selectCols = type === 'mps'
                ? 'data_gravacao, total_base, total_sem_monitoramento'
                : 'created_at, dentro, fora';
            const identifierCol = type === 'mps' ? 'empresa' :
                type === 'sla_fila' ? 'nome_fila' : 'nome_projeto';

            queryBuilder = supabase
                .from(table)
                .select(selectCols)
                .eq(identifierCol, identifier)
                .gte(timestampCol, startDate.toISOString())
                .order(timestampCol, { ascending: true });

            const { data, error } = await queryBuilder;

            if (error) {
                console.error('Error fetching history:', error);
                throw error;
            }

            if (!data || data.length === 0) return [];

            // Process data mapping
            const processedData: HistoryDataPoint[] = [];
            const processedKeys = new Set<string>();

            data.forEach((item) => {
                const timestamp = type === 'mps' ? item.data_gravacao : item.created_at;
                const dateObj = new Date(timestamp);

                // Key for grouping/uniqueness
                let key = '';
                let displayDate = '';

                if (granularity === 'daily') {
                    key = format(dateObj, 'yyyy-MM-dd');
                    displayDate = format(dateObj, 'dd/MM');
                } else {
                    // Hourly: group by YYYY-MM-DD HH
                    key = format(dateObj, 'yyyy-MM-dd HH');
                    displayDate = format(dateObj, 'dd/MM HH') + 'h';
                }

                // If daily, we want one point per day (latest). Logic: map overwrites.
                // If hourly, we want one point per hour (latest).
                // Since data is ordered ASC, processing sequentially and storing in a Map (or filtering) works.
                // But simplified: For daily, we want specific logic. For hourly, another.

                let percentual = 0;
                if (type === 'mps') {
                    const totalBase = parseInt(item.total_base as string) || 0;
                    const semMonitoramento = parseInt(item.total_sem_monitoramento as string) || 0;
                    const monitored = Math.max(0, totalBase - semMonitoramento);
                    percentual = totalBase > 0 ? (monitored / totalBase) * 100 : 0;
                } else {
                    const dentro = Number(item.dentro);
                    const fora = Number(item.fora);
                    const total = dentro + fora;
                    percentual = total > 0 ? (dentro / total) * 100 : 0;
                }

                processedData.push({
                    date: displayDate,
                    fullDate: timestamp, // Use full timestamp for accurate interactions
                    percentual: parseFloat(percentual.toFixed(2))
                });
            });

            // If daily, we act like before: group by day, take latest.
            if (granularity === 'daily') {
                const dailyMap = new Map<string, HistoryDataPoint>();
                processedData.forEach(p => {
                    const dateKey = p.fullDate.split('T')[0];
                    dailyMap.set(dateKey, { ...p, date: format(new Date(p.fullDate), 'dd/MM') });
                });
                return Array.from(dailyMap.values());
            }

            // If hourly, we might have multiple data points per hour. 
            // Prompt says: "Granularidade: por hora... Cada ponto representa valor coletado naquela hora específica".
            // If multiple, maybe average or latest? Let's take latest per hour to be consistent.
            const hourlyMap = new Map<string, HistoryDataPoint>();
            processedData.forEach(p => {
                const hourKey = format(new Date(p.fullDate), 'yyyy-MM-dd HH');
                hourlyMap.set(hourKey, p);
            });
            return Array.from(hourlyMap.values());
        },
        enabled: isOpen && !!identifier,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
