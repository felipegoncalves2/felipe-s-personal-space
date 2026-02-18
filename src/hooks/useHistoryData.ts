import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type HistoryType = 'mps' | 'sla_fila' | 'sla_projetos';
export type Granularity = 'daily' | 'hourly';

export interface HistoryDataPoint {
    date: string; // DD/MM or DD/MM HHh
    fullDate: string; // YYYY-MM-DD or ISO
    percentual: number;
    total_base?: number;
    total_sem_monitoramento?: number;
}

interface UseHistoryDataProps {
    type: HistoryType;
    identifier: string;
    isOpen: boolean;
    granularity?: Granularity;
}

export function useHistoryData({ type, identifier, isOpen, granularity = 'daily' }: UseHistoryDataProps) {
    return useQuery({
        queryKey: ['history', type, identifier, granularity],
        queryFn: async () => {
            console.log('Fetching history for:', type, identifier, granularity);

            if (type === 'mps') {
                return fetchMPSHistory(identifier, granularity);
            }

            // Use optimized RPC for SLA history
            const p_type = type; // 'sla_fila' or 'sla_projetos'
            const p_days = granularity === 'hourly' ? 5 : 15;

            const { data, error } = await (supabase as any)
                .rpc('get_sla_history', {
                    p_type,
                    p_identifier: identifier,
                    p_granularity: granularity,
                    p_days: p_days
                });

            if (error) {
                console.error('Error fetching SLA history:', error);
                throw error;
            }

            if (!data || data.length === 0) return [];

            return (data as any[]).map((item: any) => ({
                date: item.display_date,
                fullDate: item.recorded_at,
                percentual: Number(item.percentual)
            }));
        },
        enabled: isOpen && !!identifier,
        staleTime: 1000 * 60 * 5,
    });
}

async function fetchMPSHistory(identifier: string, granularity: Granularity): Promise<HistoryDataPoint[]> {
    const { subDays, format } = await import('date-fns');

    const endDate = new Date();
    const daysToSubtract = granularity === 'hourly' ? 5 : 15;
    const startDate = subDays(endDate, daysToSubtract);

    const { data, error } = await supabase
        .from('monitoramento_parque')
        .select('data_gravacao, total_base, total_sem_monitoramento')
        .eq('empresa', identifier)
        .gte('data_gravacao', startDate.toISOString())
        .order('data_gravacao', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Aggregate by period
    const aggregated = new Map<string, { total_base: number, total_sem_monitoramento: number, date: string, fullDate: string }>();

    data.forEach(item => {
        const dateObj = new Date(item.data_gravacao);
        const key = granularity === 'daily'
            ? format(dateObj, 'yyyy-MM-dd')
            : format(dateObj, 'yyyy-MM-dd HH');

        const current = aggregated.get(key) || {
            total_base: 0,
            total_sem_monitoramento: 0,
            date: granularity === 'daily' ? format(dateObj, 'dd/MM') : format(dateObj, 'dd/MM HH') + 'h',
            fullDate: item.data_gravacao
        };

        current.total_base += (parseInt(item.total_base as string) || 0);
        current.total_sem_monitoramento += (parseInt(item.total_sem_monitoramento as string) || 0);
        aggregated.set(key, current);
    });

    const result = Array.from(aggregated.values()).map(item => ({
        date: item.date,
        fullDate: item.fullDate,
        total_base: item.total_base,
        total_sem_monitoramento: item.total_sem_monitoramento,
        percentual: item.total_base > 0
            ? parseFloat((((item.total_base - item.total_sem_monitoramento) / item.total_base) * 100).toFixed(2))
            : 100
    }));

    return result;
}
