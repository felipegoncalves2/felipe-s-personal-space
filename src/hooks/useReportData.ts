import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfDay, endOfDay } from 'date-fns';

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
            const { data, error: dbError } = await supabase
                .from('monitoramento_parque')
                .select('*')
                .gte('data_gravacao', startDate.toISOString())
                .lte('data_gravacao', endDate.toISOString())
                .order('data_gravacao', { ascending: true });

            if (dbError) throw dbError;

            const formattedData: MPSReportData[] = (data || []).map(item => {
                const totalBase = parseInt(item.total_base || '0');
                const semMonit = parseInt(item.total_sem_monitoramento || '0');
                const percentual = totalBase > 0 ? ((totalBase - semMonit) / totalBase) * 100 : 0;

                return {
                    empresa: item.empresa,
                    total_base: totalBase,
                    total_sem_monitoramento: semMonit,
                    data_gravacao: item.data_gravacao,
                    percentual: parseFloat(percentual.toFixed(2))
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
            const tableName = type === 'fila' ? 'sla_fila_rn' : 'sla_projetos_rn';
            const { data, error: dbError } = await supabase
                .from(tableName)
                .select('*')
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
                .order('created_at', { ascending: true });

            if (dbError) throw dbError;

            const formattedData: SLAReportData[] = (data || []).map((item: any) => {
                const nome = type === 'fila' ? item.nome_fila : item.nome_projeto;
                const total = (item.dentro || 0) + (item.fora || 0);
                const percentual = total > 0 ? (item.dentro / total) * 100 : 0;

                return {
                    nome,
                    dentro: item.dentro || 0,
                    fora: item.fora || 0,
                    total,
                    percentual: parseFloat(percentual.toFixed(2)),
                    created_at: item.created_at
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

    return { fetchMPSReport, fetchSLAReport, loading, error };
}
