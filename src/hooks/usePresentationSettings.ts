import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PresentationSettings, MonitoringTypeKey } from '@/types';

const DEFAULT_SETTINGS: Omit<PresentationSettings, 'id' | 'created_at' | 'updated_at'> = {
  monitoring_type: 'mps',
  companies_per_page: 4,
  interval_seconds: 10,
  min_percentage: null,
  max_percentage: null,
  ignore_green: false,
  ignore_yellow: false,
  ignore_red: false,
  threshold_excellent: 98,
  threshold_attention: 80,
  threshold_critical: 80,
};

export function usePresentationSettings(monitoringType: MonitoringTypeKey = 'mps') {
  const [settings, setSettings] = useState<PresentationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('presentation_settings')
        .select('*')
        .eq('monitoring_type', monitoringType)
        .limit(1)
        .single();

      if (fetchError) {
        console.error('Error fetching presentation settings:', fetchError);
        setError('Erro ao carregar configurações');
        return;
      }

      setSettings(data as PresentationSettings);
    } catch (err) {
      console.error('Fetch settings error:', err);
      setError('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  }, [monitoringType]);

  const updateSettings = useCallback(async (updates: Partial<PresentationSettings>) => {
    if (!settings?.id) return { success: false, error: 'Configurações não encontradas' };

    try {
      const { error: updateError } = await supabase
        .from('presentation_settings')
        .update(updates)
        .eq('id', settings.id);

      if (updateError) {
        console.error('Error updating presentation settings:', updateError);
        return { success: false, error: 'Erro ao salvar configurações' };
      }

      setSettings((prev) => prev ? { ...prev, ...updates } : prev);
      return { success: true };
    } catch (err) {
      console.error('Update settings error:', err);
      return { success: false, error: 'Erro de conexão' };
    }
  }, [settings?.id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings: settings || { ...DEFAULT_SETTINGS, monitoring_type: monitoringType } as PresentationSettings,
    isLoading,
    error,
    refetch: fetchSettings,
    updateSettings,
  };
}
