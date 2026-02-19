import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

export interface BacklogHistoricoKPI {
    total_backlog: number;
    acima_30: number;
    acima_50: number;
    idade_media: number;
    data_ref: string;
}

export interface BacklogHistoricoAging {
    fila: string;
    faixa_dias: string;
    total_chamados: number;
}

export interface BacklogHistoricoSnapshot {
    numero_chamado: string;
    fila: string | null;
    dias_em_aberto: number | null;
    status: string | null;
    status_cliente: string | null;
    empresa_nome: string | null;
    codigo_projeto: string | null;
    tipo_incidente: string | null;
}

export interface BacklogHistoricoData {
    // KPI for the latest date in range
    latestKPI: BacklogHistoricoKPI | null;
    // All KPI records in the range — for the evolution chart
    evolution: BacklogHistoricoKPI[];
    // Aging for the latest date in range
    aging: BacklogHistoricoAging[];
    // Snapshot for the latest date in range
    snapshot: BacklogHistoricoSnapshot[];
}

function todayStr() {
    return format(new Date(), 'yyyy-MM-dd');
}
function nDaysAgoStr(n: number) {
    return format(subDays(new Date(), n), 'yyyy-MM-dd');
}

export function useBacklogHistorico() {
    const defaultFrom = nDaysAgoStr(4); // 5 days including today
    const defaultTo = todayStr();

    const [dateFrom, setDateFrom] = useState(defaultFrom);
    const [dateTo, setDateTo] = useState(defaultTo);
    const [data, setData] = useState<BacklogHistoricoData>({
        latestKPI: null,
        evolution: [],
        aging: [],
        snapshot: [],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRange = useCallback(async (from: string, to: string) => {
        if (!from || !to) return;
        setLoading(true);
        setError(null);
        try {
            // 1. Evolution: all daily KPIs in range
            const { data: evo, error: evoErr } = await supabase
                .from('backlog_total_diario' as any)
                .select('total_backlog, acima_30, acima_50, idade_media, data_ref')
                .gte('data_ref', from)
                .lte('data_ref', to)
                .order('data_ref', { ascending: true });

            if (evoErr) console.warn('Evolution fetch error:', evoErr.message);

            const evolution = (evo as unknown as BacklogHistoricoKPI[]) ?? [];

            // Latest date with data — for KPI card + aging + snapshot
            const latestWithData = evolution.length > 0
                ? evolution[evolution.length - 1]
                : null;
            const latestDate = latestWithData?.data_ref ?? to;

            // 2. Aging for latest date
            const { data: agingData, error: agingErr } = await supabase
                .from('backlog_analytics' as any)
                .select('fila, faixa_dias, total_chamados')
                .eq('data_ref', latestDate);

            if (agingErr) console.warn('Aging fetch error:', agingErr.message);

            // 3. Snapshot for latest date
            const { data: snapData, error: snapErr } = await supabase
                .from('backlog_snapshot' as any)
                .select('numero_chamado, fila, dias_em_aberto, status, status_cliente, empresa_nome, codigo_projeto, tipo_incidente')
                .eq('snapshot_date', latestDate)
                .limit(500);

            if (snapErr) console.warn('Snapshot fetch error:', snapErr.message);

            setData({
                latestKPI: latestWithData,
                evolution,
                aging: (agingData as unknown as BacklogHistoricoAging[]) ?? [],
                snapshot: (snapData as unknown as BacklogHistoricoSnapshot[]) ?? [],
            });
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar histórico');
        } finally {
            setLoading(false);
        }
    }, []);

    // Auto-load on mount with default range
    useEffect(() => {
        fetchRange(defaultFrom, defaultTo);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRangeChange = useCallback((from: string, to: string) => {
        setDateFrom(from);
        setDateTo(to);
        if (from && to && from <= to) {
            fetchRange(from, to);
        }
    }, [fetchRange]);

    return {
        data,
        loading,
        error,
        dateFrom,
        dateTo,
        handleRangeChange,
    };
}
