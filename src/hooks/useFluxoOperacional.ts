import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isWithinInterval, startOfDay, parseISO } from 'date-fns';

export interface FluxoOperacionalRecord {
    dia: string;
    display_dia: string;
    abertos: number;
    encerrados: number;
    evolucao_acumulada: number;
}

export function useFluxoOperacional() {
    const [data, setData] = useState<FluxoOperacionalRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFluxoData = async () => {
        try {
            setLoading(true);
            setError(null);

            const now = new Date();
            const startOfCurrMonth = startOfMonth(now);
            const endOfCurrMonth = endOfMonth(now);
            // We only want data until today
            const endOfData = now < endOfCurrMonth ? now : endOfCurrMonth;

            const startDateStr = format(startOfCurrMonth, 'yyyy-MM-dd');
            const endDateStr = format(endOfData, 'yyyy-MM-dd');

            // 1. Fetch created tickets for the month from backlog
            const { data: openedDataBacklog, error: openedErrorBacklog } = await supabase
                .from('backlog_monitoramento' as any)
                .select('numero_referencia, data_criacao')
                .gte('data_criacao', `${startDateStr}T00:00:00`)
                .lte('data_criacao', `${endDateStr}T23:59:59`);

            if (openedErrorBacklog) throw openedErrorBacklog;

            // 2. Fetch created tickets for the month from SLA detalhado
            const { data: openedDataSla, error: openedErrorSla } = await supabase
                .from('sla_detalhado_rn')
                .select('numero_referencia, data_criacao')
                .not('data_criacao', 'is', null)
                .gte('data_criacao', `${startDateStr}T00:00:00`)
                .lte('data_criacao', `${endDateStr}T23:59:59`);

            if (openedErrorSla) throw openedErrorSla;

            // 3. Fetch closed tickets for the month from SLA detalhado
            const { data: closedData, error: closedError } = await supabase
                .from('sla_detalhado_rn')
                .select('data_fechamento')
                .not('data_fechamento', 'is', null)
                .gte('data_fechamento', `${startDateStr}T00:00:00`)
                .lte('data_fechamento', `${endDateStr}T23:59:59`);

            if (closedError) throw closedError;

            // 4. Process data by day
            const days = eachDayOfInterval({ start: startOfCurrMonth, end: endOfData });

            const openedByDay: Record<string, number> = {};
            const closedByDay: Record<string, number> = {};
            
            // Usar um Set para rastrear quais chamados já foram contados por dia para evitar duplicidade
            const processedTicketsByDay: Record<string, Set<string>> = {};

            const processOpenedTicket = (item: any) => {
                if (!item.data_criacao) return;
                const d = format(parseISO(item.data_criacao), 'yyyy-MM-dd');
                const ticketRef = item.numero_referencia;
                
                if (!processedTicketsByDay[d]) {
                    processedTicketsByDay[d] = new Set();
                }
                
                if (ticketRef && !processedTicketsByDay[d].has(ticketRef)) {
                    processedTicketsByDay[d].add(ticketRef);
                    openedByDay[d] = (openedByDay[d] || 0) + 1;
                } else if (!ticketRef) {
                    // Fallback se não tiver numero_referencia (apenas incrementa)
                    openedByDay[d] = (openedByDay[d] || 0) + 1;
                }
            };

            (openedDataBacklog as any[])?.forEach(processOpenedTicket);
            (openedDataSla as any[])?.forEach(processOpenedTicket);

            closedData?.forEach(item => {
                const d = format(parseISO(item.data_fechamento), 'yyyy-MM-dd');
                closedByDay[d] = (closedByDay[d] || 0) + 1;
            });

            let runningEvolution = 0;
            const result: FluxoOperacionalRecord[] = days.map(day => {
                const dStr = format(day, 'yyyy-MM-dd');
                const abertos = openedByDay[dStr] || 0;
                const encerrados = closedByDay[dStr] || 0;
                const saldoDia = abertos - encerrados;
                runningEvolution += saldoDia;

                return {
                    dia: dStr,
                    display_dia: format(day, 'dd/MM'),
                    abertos,
                    encerrados,
                    evolucao_acumulada: runningEvolution
                };
            });

            setData(result);
        } catch (err: any) {
            console.error('Error fetching fluxo operacional:', err);
            setError(err.message || 'Falha ao carregar fluxo operacional');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFluxoData();
    }, []);

    return { data, loading, error, refetch: fetchFluxoData };
}
