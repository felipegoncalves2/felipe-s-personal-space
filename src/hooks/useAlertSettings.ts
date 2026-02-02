import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AlertMonitoringType = 'mps' | 'sla_fila' | 'sla_projeto';

export interface AlertSettings {
    id?: string;
    tipo_monitoramento: AlertMonitoringType;
    anomaly_enabled: boolean;
    anomaly_moving_avg_days: number;
    anomaly_stddev_multiplier: number;
    trend_enabled: boolean;
    trend_consecutive_periods: number;
    auto_resolve_enabled: boolean;
    auto_resolve_consecutive_readings: number;
}

export const DEFAULT_ALERT_SETTINGS: Record<AlertMonitoringType, AlertSettings> = {
    mps: {
        tipo_monitoramento: 'mps',
        anomaly_enabled: true,
        anomaly_moving_avg_days: 7,
        anomaly_stddev_multiplier: 2.0,
        trend_enabled: true,
        trend_consecutive_periods: 3,
        auto_resolve_enabled: true,
        auto_resolve_consecutive_readings: 2
    },
    sla_fila: {
        tipo_monitoramento: 'sla_fila',
        anomaly_enabled: true,
        anomaly_moving_avg_days: 7,
        anomaly_stddev_multiplier: 2.0,
        trend_enabled: true,
        trend_consecutive_periods: 3,
        auto_resolve_enabled: true,
        auto_resolve_consecutive_readings: 2
    },
    sla_projeto: {
        tipo_monitoramento: 'sla_projeto',
        anomaly_enabled: true,
        anomaly_moving_avg_days: 7,
        anomaly_stddev_multiplier: 2.0,
        trend_enabled: true,
        trend_consecutive_periods: 3,
        auto_resolve_enabled: true,
        auto_resolve_consecutive_readings: 2
    }
};

export function useAlertSettings(initialType: AlertMonitoringType = 'mps') {
    const [settings, setSettings] = useState<AlertSettings>(DEFAULT_ALERT_SETTINGS[initialType]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSettings = useCallback(async (type: AlertMonitoringType) => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('monitoring_alert_settings')
                .select('*')
                .eq('tipo_monitoramento', type)
                .maybeSingle();

            if (error) {
                console.error('Error fetching alert settings:', error);
                toast.error('Erro ao carregar configurações de alertas');
                return;
            }

            if (data) {
                setSettings(data as AlertSettings);
            } else {
                // Use defaults if not found
                setSettings(DEFAULT_ALERT_SETTINGS[type]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveSettings = async (newSettings: AlertSettings) => {
        try {
            // Upsert based on tipo_monitoramento (unique constraint)
            // Check if ID exists to update or not. Actually upsert on unique key is easier.
            const { data, error } = await supabase
                .from('monitoring_alert_settings')
                .upsert(
                    {
                        tipo_monitoramento: newSettings.tipo_monitoramento,
                        anomaly_enabled: newSettings.anomaly_enabled,
                        anomaly_moving_avg_days: newSettings.anomaly_moving_avg_days,
                        anomaly_stddev_multiplier: newSettings.anomaly_stddev_multiplier,
                        trend_enabled: newSettings.trend_enabled,
                        trend_consecutive_periods: newSettings.trend_consecutive_periods,
                        auto_resolve_enabled: newSettings.auto_resolve_enabled,
                        auto_resolve_consecutive_readings: newSettings.auto_resolve_consecutive_readings,
                        updated_at: new Date().toISOString()
                    },
                    { onConflict: 'tipo_monitoramento' }
                )
                .select()
                .single();

            if (error) {
                throw error;
            }

            if (data) {
                setSettings(data as AlertSettings);
                return true;
            }
            return false;

        } catch (err) {
            console.error('Error saving alert settings:', err);
            toast.error('Erro ao salvar configurações');
            return false;
        }
    };

    useEffect(() => {
        fetchSettings(initialType);
    }, [fetchSettings, initialType]);

    return {
        settings,
        isLoading,
        saveSettings,
        refetch: () => fetchSettings(initialType)
    };
}
