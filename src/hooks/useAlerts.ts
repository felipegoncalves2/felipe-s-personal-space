import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MonitoringAlert } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useAlerts() {
    const { user } = useAuth();
    const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAlerts = useCallback(async () => {
        try {
            setIsLoading(true);
            const { data, error: fetchError } = await supabase
                .from('monitoring_alerts')
                .select('*')
                .order('detected_at', { ascending: false });

            if (fetchError) throw fetchError;
            setAlerts((data || []) as any as MonitoringAlert[]);
        } catch (err: any) {
            console.error('Error fetching alerts:', err);
            setError(err.message);
            toast.error('Erro ao carregar alertas');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const treatAlert = useCallback(async (alertId: string, comment: string) => {
        try {
            const { error: updateError } = await supabase
                .from('monitoring_alerts')
                .update({
                    tratado: true,
                    tratado_em: new Date().toISOString(),
                    tratado_por: user?.id,
                    comentario_tratamento: comment
                })
                .eq('id', alertId);

            if (updateError) throw updateError;

            toast.success('Alerta tratado com sucesso');
            fetchAlerts();
        } catch (err: any) {
            console.error('Error treating alert:', err);
            toast.error('Erro ao tratar alerta');
        }
    }, [user?.id, fetchAlerts]);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    return {
        alerts,
        isLoading,
        error,
        fetchAlerts,
        treatAlert
    };
}
