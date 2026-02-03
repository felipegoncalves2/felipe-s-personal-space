import { supabase } from '@/integrations/supabase/client';
import { AlertSeverity, AlertType } from '@/types';

interface PersistAlertParams {
    tipo_monitoramento: 'mps' | 'sla_fila' | 'sla_projeto';
    identificador_item: string;
    alert_type: AlertType;
    severity: AlertSeverity;
    percentual_atual: number;
    contexto?: any;
}

export async function persistAlert(params: PersistAlertParams) {
    try {
        // Deduplication check: Don't insert if there's an active (not treated) alert 
        // of the same type for the same item within the last 4 hours
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

        const { data: existing, error: checkError } = await supabase
            .from('monitoring_alerts')
            .select('id')
            .eq('tipo_monitoramento', params.tipo_monitoramento)
            .eq('identificador_item', params.identificador_item)
            .eq('alert_type', params.alert_type)
            .eq('tratado', false)
            .gte('detected_at', fourHoursAgo)
            .maybeSingle();

        if (checkError) {
            console.error('Error checking existing alert:', checkError);
            return;
        }

        if (existing) {
            // Alert already exists and is active, skip insertion
            return;
        }

        // Insert new alert
        const { error: insertError } = await supabase
            .from('monitoring_alerts')
            .insert({
                tipo_monitoramento: params.tipo_monitoramento,
                identificador_item: params.identificador_item,
                alert_type: params.alert_type,
                severity: params.severity,
                percentual_atual: params.percentual_atual,
                contexto: params.contexto,
                detected_at: new Date().toISOString()
            });

        if (insertError) {
            console.error('Error persisting alert:', insertError);
        }
    } catch (err) {
        console.error('Unexpected error in persistAlert:', err);
    }
}
