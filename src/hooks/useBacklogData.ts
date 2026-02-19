import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, startOfDay } from 'date-fns';

export interface BacklogItem {
    numero_referencia: string | null;
    fila: string | null;
    status: string | null;
    nome_projeto: string | null;
    codigo_projeto: string | null;
    empresa: string | null;
    empresa_nome: string | null;
    status_cliente: string | null;
    data_criacao: string | null;
    dias_em_aberto: number | null;
    tempo_atendimento_segundos: number | null;
    tipo_incidente: string | null;
    estado: string | null;
    cidade: string | null;
    mes_abertura: string | null;
    conta_atribuida: string | null;
    situacao_equipamento: string | null;
}

export interface BacklogFilters {
    dateFrom: string;
    dateTo: string;
    codigoProjeto: string[];
    empresaNome: string[];
    fila: string[];
    estado: string[];
    contaAtribuida: string[];
    faixaDias: string; // '' | 'ate3' | '4a5' | '6a10' | '11a30' | '31a50' | 'acima50'
    status: string[];
    statusCliente: string[];
    tipoIncidente: string[];
}

export const DEFAULT_FILTERS: BacklogFilters = {
    dateFrom: '',
    dateTo: '',
    codigoProjeto: [],
    empresaNome: [],
    fila: [],
    estado: [],
    contaAtribuida: [],
    faixaDias: '',
    status: [],
    statusCliente: [],
    tipoIncidente: [],
};

export function getDiasFaixa(dias: number | null): string {
    if (dias === null) return 'Sem info';
    if (dias <= 3) return 'Até 3 dias';
    if (dias <= 5) return '4 a 5 dias';
    if (dias <= 10) return '6 a 10 dias';
    if (dias <= 30) return '11 a 30 dias';
    if (dias <= 50) return '31 a 50 dias';
    return 'Acima de 50 dias';
}

export const FAIXAS_DIAS = [
    { key: 'ate3', label: 'Até 3 dias', color: '#22c55e' },
    { key: '4a5', label: '4 a 5 dias', color: '#84cc16' },
    { key: '6a10', label: '6 a 10 dias', color: '#eab308' },
    { key: '11a30', label: '11 a 30 dias', color: '#f97316' },
    { key: '31a50', label: '31 a 50 dias', color: '#ef4444' },
    { key: 'acima50', label: 'Acima de 50 dias', color: '#7f1d1d' },
];

function matchesFaixa(dias: number | null, faixa: string): boolean {
    if (!faixa) return true;
    if (dias === null) return false;
    if (faixa === 'ate3') return dias <= 3;
    if (faixa === '4a5') return dias >= 4 && dias <= 5;
    if (faixa === '6a10') return dias >= 6 && dias <= 10;
    if (faixa === '11a30') return dias >= 11 && dias <= 30;
    if (faixa === '31a50') return dias >= 31 && dias <= 50;
    if (faixa === 'acima50') return dias > 50;
    return true;
}

export interface BacklogDailyKPI {
    total_backlog: number;
    acima_30: number;
    acima_50: number;
    idade_media: number;
}

export function useBacklogData() {
    const [rawData, setRawData] = useState<BacklogItem[]>([]);
    const [yesterdayCount, setYesterdayCount] = useState<number | null>(null);
    const [dailyKPI, setDailyKPI] = useState<BacklogDailyKPI | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [filters, setFilters] = useState<BacklogFilters>(DEFAULT_FILTERS);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch all current backlog records
            const { data: backlogData, error: backlogError } = await supabase
                .from('backlog_monitoramento' as any)
                .select('*');

            if (backlogError) throw backlogError;

            setRawData((backlogData as unknown as BacklogItem[]) || []);

            // 2. Fetch today's KPI from backlog_total_diario
            const today = format(new Date(), 'yyyy-MM-dd');
            const { data: kpiData, error: kpiError } = await supabase
                .from('backlog_total_diario' as any)
                .select('total_backlog, acima_30, acima_50, idade_media')
                .eq('data_ref', today)
                .maybeSingle();

            if (!kpiError && kpiData) {
                setDailyKPI(kpiData as unknown as BacklogDailyKPI);
            } else {
                // No record for today - trigger the processing function
                try {
                    await supabase.rpc('processar_backlog_diario' as any);
                    // Fetch again after processing
                    const { data: kpiData2 } = await supabase
                        .from('backlog_total_diario' as any)
                        .select('total_backlog, acima_30, acima_50, idade_media')
                        .eq('data_ref', today)
                        .maybeSingle();
                    if (kpiData2) {
                        setDailyKPI(kpiData2 as unknown as BacklogDailyKPI);
                    }
                } catch {
                    // RPC may not exist yet; fall back to null (KPIs will compute from rawData)
                    setDailyKPI(null);
                }
            }

            // 3. Fetch yesterday's snapshot count for variation KPI
            const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
            const { data: yesterdayData, error: yesterdayError } = await supabase
                .from('backlog_total_diario' as any)
                .select('total_backlog')
                .eq('data_ref', yesterday)
                .maybeSingle();

            if (!yesterdayError && yesterdayData) {
                setYesterdayCount((yesterdayData as any).total_backlog ?? null);
            }

            setLastUpdated(new Date());
        } catch (err: any) {
            console.error('Error fetching backlog data:', err);
            setError(err.message || 'Erro ao carregar dados de backlog');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Apply filters reactively
    const filteredData = useMemo(() => {
        let result = [...rawData];

        if (filters.dateFrom) {
            result = result.filter(d => d.data_criacao && d.data_criacao >= filters.dateFrom);
        }
        if (filters.dateTo) {
            result = result.filter(d => d.data_criacao && d.data_criacao <= filters.dateTo + 'T23:59:59');
        }
        if (filters.codigoProjeto.length > 0) {
            result = result.filter(d => d.codigo_projeto && filters.codigoProjeto.includes(d.codigo_projeto));
        }
        if (filters.empresaNome.length > 0) {
            result = result.filter(d => d.empresa_nome && filters.empresaNome.includes(d.empresa_nome));
        }
        if (filters.fila.length > 0) {
            result = result.filter(d => d.fila && filters.fila.includes(d.fila));
        }
        if (filters.estado.length > 0) {
            result = result.filter(d => d.estado && filters.estado.includes(d.estado));
        }
        if (filters.contaAtribuida.length > 0) {
            result = result.filter(d => d.conta_atribuida && filters.contaAtribuida.includes(d.conta_atribuida));
        }
        if (filters.faixaDias) {
            result = result.filter(d => matchesFaixa(d.dias_em_aberto, filters.faixaDias));
        }
        if (filters.status.length > 0) {
            result = result.filter(d => d.status && filters.status.includes(d.status));
        }
        if (filters.statusCliente.length > 0) {
            result = result.filter(d => d.status_cliente && filters.statusCliente.includes(d.status_cliente));
        }
        if (filters.tipoIncidente.length > 0) {
            result = result.filter(d => d.tipo_incidente && filters.tipoIncidente.includes(d.tipo_incidente));
        }

        return result;
    }, [rawData, filters]);

    // Unique values for filter dropdowns
    const filterOptions = useMemo(() => {
        const unique = (field: keyof BacklogItem) =>
            [...new Set(rawData.map(d => d[field]).filter(Boolean) as string[])].sort();
        return {
            codigoProjeto: unique('codigo_projeto'),
            empresaNome: unique('empresa_nome'),
            fila: unique('fila'),
            estado: unique('estado'),
            contaAtribuida: unique('conta_atribuida'),
            status: unique('status'),
            statusCliente: unique('status_cliente'),
            tipoIncidente: unique('tipo_incidente'),
        };
    }, [rawData]);

    return {
        rawData,
        filteredData,
        yesterdayCount,
        dailyKPI,
        loading,
        error,
        lastUpdated,
        refetch: fetchData,
        filters,
        setFilters,
        filterOptions,
    };
}
