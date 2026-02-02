import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface EmailConfig {
    id?: string;
    host: string;
    port: string;
    username: string;
    password: string;
    useTls: boolean;
    useSsl: boolean;
    recipients: string[]; // Not in table? Wait, let's check the user prompt again.
    subject: string; // Not in table?
    body: string; // Not in table?
    enabled: boolean;
    fromName: string;
    fromEmail: string;
}

// User schema does NOT have recipients, subject, body. 
// "create table public.smtp_settings ( ... constraint smtp_settings_pkey primary key (id) )"
// Wait, the user prompt showed:
// create table public.smtp_settings ( ... smtp_from_name text not null, enabled boolean ... )
// It does NOT show recipients, subject, body.
// BUT the previous request asked to persist them.
// "Salvar explicitamente... smtp_from_email, smtp_from_name..."
// It seems the user chose to create a table strictly for SMTP connection.
// However, the UI has fields for recipients, subject, body.
// I will keep them in local state or try to find where to store them.
// Actually, looking at the user request again: "Eu criei duas tabelas uma para o smtp e a outra pra armazenar e usar as configurações de alertas".
// The provided SQL for `smtp_settings` strictly covers connection.
// I will check if I can add recipients/template back to localStorage or just assume they aren't persisted for now if the table doesn't support it?
// Ref: "As configurações não estão sendo persistidas... Salvar explicitamente... recipients... " was in the PREVIOUS prompt.
// In THIS prompt, the user gave specific SQL.
// I will implement what fits in the SQL and maybe warn about missing fields or use localStorage for the rest?
// The user said "Eu criei duas tabelas...".
// I will map what I can. For recipients, the SQL is missing it.
// Wait, I will re-read the SQL carefully.
/*
create table public.smtp_settings (
  id uuid not null default gen_random_uuid (),
  smtp_host text not null,
  smtp_port integer not null,
  smtp_secure boolean not null default false,
  smtp_user text not null,
  smtp_password text not null,
  smtp_from_email text not null,
  smtp_from_name text not null,
  enabled boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint smtp_settings_pkey primary key (id)
)
*/
// Indeed, recipients/template are missing.
// I'll stick to localStorage for the template/recipients part OR just warn.
// Given "PERSISTÊNCIA DAS CONFIGURAÇÕES... Fonte de persistência... Supabase", I should probably use Supabase.
// Since the table is missing columns, I'll assume I should strictly use what's there for SMTP.
// I'll combine: SMTP connection -> Supabase. Recipients/Template -> LocalStorage (to avoid breaking the feature from previous turn).

export const DEFAULT_EMAIL_CONFIG: EmailConfig = {
    host: '',
    port: '587',
    username: '',
    password: '',
    useTls: true,
    useSsl: false,
    recipients: [''],
    subject: 'Alerta TECHUB Monitor - {{empresa}}',
    body: `Olá,

Foi detectada uma queda significativa no monitoramento:

Empresa: {{empresa}}
Percentual atual: {{percentual}}%
Data da aferição: {{data}}

Por favor, verifique o sistema.

Atenciosamente,
TECHUB Monitor`,
    enabled: true,
    fromName: 'Techub Monitor',
    fromEmail: '',
};

export function useEmailSettings() {
    const [settings, setSettings] = useState<EmailConfig>(DEFAULT_EMAIL_CONFIG);
    const [isLoading, setIsLoading] = useState(true);

    // Helper to map DB row to EmailConfig
    const mapRowToConfig = (row: any): Partial<EmailConfig> => ({
        id: row.id,
        host: row.smtp_host || '',
        port: row.smtp_port?.toString() || '587',
        username: row.smtp_user || '',
        password: row.smtp_password || '',
        useSsl: row.smtp_secure ?? false,
        useTls: !row.smtp_secure, // inferred?
        enabled: row.enabled ?? true,
        fromName: row.smtp_from_name || '',
        fromEmail: row.smtp_from_email || '',
    });

    // Helper to map EmailConfig to DB row
    const mapConfigToRow = (config: EmailConfig) => ({
        smtp_host: config.host,
        smtp_port: parseInt(config.port) || 587,
        smtp_user: config.username,
        smtp_password: config.password,
        smtp_secure: config.useSsl,
        smtp_from_name: config.fromName,
        smtp_from_email: config.fromEmail,
        enabled: config.enabled,
        updated_at: new Date().toISOString(),
    });

    const fetchSettings = useCallback(async () => {
        try {
            setIsLoading(true);

            // Fetch SMTP connection from Supabase
            // Order by updated_at desc to get the latest config if multiple exist
            const { data, error } = await supabase
                .from('smtp_settings')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            console.log('[useEmailSettings] Fetched data:', data, 'Error:', error);

            if (error) {
                console.error('Error fetching SMTP settings:', error);
                toast.error('Erro ao carregar configurações do servidor');
                return;
            }

            // Fetch Recipients/Template from LocalStorage (since not in DB)
            const storedLocal = localStorage.getItem('techub_email_template_settings');
            const localSettings = storedLocal ? JSON.parse(storedLocal) : {};

            if (data) {
                const mapped = mapRowToConfig(data);
                console.log('[useEmailSettings] Mapped config:', mapped);

                setSettings({
                    ...DEFAULT_EMAIL_CONFIG,
                    ...localSettings,
                    ...mapped
                });
            } else {
                console.log('[useEmailSettings] No data found in DB, using defaults');
                setSettings({ ...DEFAULT_EMAIL_CONFIG, ...localSettings });
            }
        } catch (error) {
            console.error('Unexpected error loading settings:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const saveSettings = async (newSettings: EmailConfig): Promise<boolean> => {
        try {
            const rowData = mapConfigToRow(newSettings);

            // Save SMTP to Supabase
            let error;
            if (settings.id) {
                const { error: updateError } = await supabase
                    .from('smtp_settings')
                    .update(rowData)
                    .eq('id', settings.id);
                error = updateError;
            } else {
                const { data, error: insertError } = await supabase
                    .from('smtp_settings')
                    .insert([rowData])
                    .select()
                    .single();
                if (data) {
                    setSettings(prev => ({ ...prev, id: data.id }));
                    newSettings.id = data.id; // ensure local update has ID
                }
                error = insertError;
            }

            if (error) {
                console.error('Error saving SMTP settings to DB:', error);
                return false;
            }

            // Save Template to LocalStorage
            const templateSettings = {
                recipients: newSettings.recipients,
                subject: newSettings.subject,
                body: newSettings.body
            };
            localStorage.setItem('techub_email_template_settings', JSON.stringify(templateSettings));

            setSettings(newSettings);
            return true;
        } catch (error) {
            console.error('Unexpected error saving settings:', error);
            return false;
        }
    };

    const getSavedSettings = useCallback((): EmailConfig => {
        return settings;
    }, [settings]);

    return {
        settings,
        isLoading,
        saveSettings,
        getSavedSettings,
        setSettings,
        refetch: fetchSettings
    };
}
