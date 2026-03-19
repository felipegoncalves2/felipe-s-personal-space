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
            const startDateStr = format(startDate, 'yyyy-MM-dd');
            const endDateStr = format(endDate, 'yyyy-MM-dd');

            const { data, error } = await supabase
                .from('resumo_mps_dia')
                .select('*')
                .gte('data', startDateStr)
                .lte('data', endDateStr)
                .order('data', { ascending: true });

            if (error) throw error;

            if (!data || data.length === 0) return [];

            const formattedData: MPSReportData[] = data.map((item: any) => ({
                empresa: item.empresa,
                total_base: Number(item.total_base),
                total_sem_monitoramento: Number(item.total_sem_comunicacao),
                data_gravacao: item.data,
                percentual: Number(item.percentual)
            }));

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
            const startDateStr = format(startDate, 'yyyy-MM-dd');
            const endDateStr = format(endDate, 'yyyy-MM-dd');
            const tableName = type === 'fila' ? 'resumo_sla_fila_dia' : 'resumo_sla_projeto_dia';

            const { data, error } = await supabase
                .from(tableName as any)
                .select('*')
                .gte('data', startDateStr)
                .lte('data', endDateStr)
                .order('data', { ascending: true });

            if (error) throw error;

            if (!data || data.length === 0) return [];

            const formattedData: SLAReportData[] = data.map((item: any) => ({
                nome: type === 'fila' ? item.fila : item.nome_projeto,
                dentro: Number(item.dentro),
                fora: Number(item.fora),
                total: Number(item.total),
                percentual: Number(item.percentual),
                created_at: item.data // Mapping date field to created_at for historical consistency in visualizer
            }));

            // Sort by Date DESC and Name ASC
            formattedData.sort((a, b) => {
                if (a.created_at !== b.created_at) {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                }
                return a.nome.localeCompare(b.nome);
            });

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
