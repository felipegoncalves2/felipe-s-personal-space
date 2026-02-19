import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

export interface MPSReportData {
    empresa: string;
    total_base: number;
    total_sem_monitoramento: number;
    data_gravacao: string;
    percentual: number;
}

export interface SLAReportData {
    nome: string;
    dentro: number;
    fora: number;
    total: number;
    percentual: number;
    created_at: string;
}

export function useReportData() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMPSReport = useCallback(async (startDate: Date, endDate: Date) => {
        setLoading(true);
        setError(null);
        try {
            const startDateStr = startDate.toISOString();
            const endDateStr = endDate.toISOString();
            const PAGE_SIZE = 1000;

            // 1. Get total count first to parallelize
            const { count, error: countError } = await supabase
                .from('monitoramento_parque')
                .select('id', { count: 'exact', head: true })
                .gte('data_gravacao', startDateStr)
                .lte('data_gravacao', endDateStr);

            if (countError) throw countError;
            const totalRecords = count || 0;

            if (totalRecords === 0) return [];

            // 2. Prepare parallel requests
            const numPages = Math.ceil(totalRecords / PAGE_SIZE);
            const pagePromises = Array.from({ length: numPages }).map((_, i) => {
                const from = i * PAGE_SIZE;
                const to = from + PAGE_SIZE - 1;
                return supabase
                    .from('monitoramento_parque')
                    .select('data_gravacao, empresa, total_base, total_sem_monitoramento')
                    .gte('data_gravacao', startDateStr)
                    .lte('data_gravacao', endDateStr)
                    .order('data_gravacao', { ascending: true })
                    .range(from, to);
            });

            // 3. Execute all in parallel
            const results = await Promise.all(pagePromises);

            // Check for errors in any page
            for (const res of results) {
                if (res.error) throw res.error;
            }

            const allData = results.flatMap(res => res.data || []);

            const formattedData: MPSReportData[] = allData.map((item: any) => {
                const totalBase = Number(item.total_base);
                const totalSem = Number(item.total_sem_monitoramento);
                const percentual = totalBase > 0
                    ? parseFloat((((totalBase - totalSem) / totalBase) * 100).toFixed(2))
                    : 100;

                return {
                    empresa: item.empresa,
                    total_base: totalBase,
                    total_sem_monitoramento: totalSem,
                    data_gravacao: item.data_gravacao,
                    percentual: percentual
                };
            });

            return formattedData;
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSLAReport = useCallback(async (type: 'fila' | 'projetos', startDate: Date, endDate: Date) => {
        setLoading(true);
        setError(null);
        try {
            // Query sla_detalhado_rn and aggregate to simulate snapshots (Paginated)
            let data: any[] = [];
            let from = 0;
            const PAGE_SIZE = 1000;
            let hasMore = true;

            while (hasMore) {
                const { data: pageData, error: pageError } = await supabase
                    .from('sla_detalhado_rn' as any)
                    .select('*')
                    .gte('created_at', startDate.toISOString())
                    .lte('created_at', endDate.toISOString())
                    .range(from, from + PAGE_SIZE - 1);

                if (pageError) throw pageError;

                if (!pageData || pageData.length === 0) {
                    hasMore = false;
                } else {
                    data = [...data, ...pageData];
                    from += PAGE_SIZE;
                    if (pageData.length < PAGE_SIZE) hasMore = false;
                }
            }

            // Group by day and item name
            const grouped = new Map<string, { dentro: number; fora: number; name: string; date: string }>();

            (data || []).forEach((item: any) => {
                const name = type === 'fila' ? item.fila : item.nome_projeto;
                if (!name) return;

                const dayKey = format(new Date(item.created_at), 'yyyy-MM-dd');
                const groupKey = `${dayKey}_${name}`;

                const existing = grouped.get(groupKey) || {
                    dentro: 0,
                    fora: 0,
                    name: name,
                    date: dayKey
                };

                if (item.sla_perdido === 'Sim') {
                    existing.fora += 1;
                } else {
                    existing.dentro += 1;
                }

                grouped.set(groupKey, existing);
            });

            const formattedData: SLAReportData[] = Array.from(grouped.values()).map(item => {
                const total = item.dentro + item.fora;
                return {
                    nome: item.name,
                    dentro: item.dentro,
                    fora: item.fora,
                    total: total,
                    percentual: total > 0 ? parseFloat(((item.dentro / total) * 100).toFixed(2)) : 100,
                    created_at: new Date(item.date).toISOString()
                };
            }).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

            return formattedData;
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    return { fetchMPSReport, fetchSLAReport, loading, error };
}
