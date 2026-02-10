import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type HistoryType = 'mps' | 'sla_fila' | 'sla_projetos';
export type Granularity = 'daily' | 'hourly';

export interface HistoryDataPoint {
    date: string; // DD/MM or DD/MM HHh
    fullDate: string; // YYYY-MM-DD or ISO
    percentual: number;
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

    const processedData: HistoryDataPoint[] = data.map((item) => {
        const dateObj = new Date(item.data_gravacao);
        const totalBase = parseInt(item.total_base as string) || 0;
        const semMonitoramento = parseInt(item.total_sem_monitoramento as string) || 0;
        const monitored = Math.max(0, totalBase - semMonitoramento);
        const percentual = totalBase > 0 ? (monitored / totalBase) * 100 : 100;

        const displayDate = granularity === 'daily'
            ? format(dateObj, 'dd/MM')
            : format(dateObj, 'dd/MM HH') + 'h';

        return {
            date: displayDate,
            fullDate: item.data_gravacao,
            percentual: parseFloat(percentual.toFixed(2))
        };
    });

    // Deduplicate by period
    const map = new Map<string, HistoryDataPoint>();
    processedData.forEach(p => {
        const key = granularity === 'daily'
            ? p.fullDate.split('T')[0]
            : format(new Date(p.fullDate), 'yyyy-MM-dd HH');
        map.set(key, p);
    });

    return Array.from(map.values());
}
