import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Plus, Trash2, Save, Send, Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useEmailSettings, EmailConfig } from '@/hooks/useEmailSettings';

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

export function EmailSettings() {
  const { settings, isLoading, saveSettings, getSavedSettings, setSettings } = useEmailSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testError, setTestError] = useState<string | null>(null);
  const [testDetails, setTestDetails] = useState<any>(null); // Type 'any' for simplicity or define SMTPResponse interface

  // Local state for validations
  const [errors, setErrors] = useState<Partial<Record<keyof EmailConfig, string>>>({});

  const validate = (config: EmailConfig) => {
    const newErrors: typeof errors = {};
    if (!config.host.trim()) newErrors.host = 'Host é obrigatório';
    if (!config.port.trim()) newErrors.port = 'Porta é obrigatória';
    else if (isNaN(Number(config.port))) newErrors.port = 'Porta deve ser numérica';

    if (!config.username.trim()) newErrors.username = 'Usuário é obrigatório';
    // Password might be empty? Usually not for SMTP auth.
    if (!config.password) newErrors.password = 'Senha é obrigatória';

    // Validate SSL/TLS vs Port
    const port = Number(config.port);
    if (config.useSsl && port !== 465) {
      // Warning or error? "Exemplo de erro aceitável: “Porta 465 requer conexão segura (SSL/TLS)”"
      // Usually 465 is SSL. 587 is TLS.
    }

    if (!config.fromEmail) newErrors.fromEmail = 'Email de remetente obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.fromEmail)) newErrors.fromEmail = 'Email inválido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddRecipient = () => {
    setSettings((prev) => ({
      ...prev,
      recipients: [...prev.recipients, ''],
    }));
  };

  const handleRemoveRecipient = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index),
    }));
  };

  const handleRecipientChange = (index: number, value: string) => {
    setSettings((prev) => ({
      ...prev,
      recipients: prev.recipients.map((r, i) => (i === index ? value : r)),
    }));
  };

  const handleSave = async () => {
    if (!validate(settings)) {
      toast.error('Verifique os campos obrigatórios');
      return;
    }

    setIsSaving(true);

    // Simulate slight delay for UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    const success = saveSettings(settings);
    if (success) {
      toast.success('Configurações de e-mail salvas com sucesso');
    } else {
      toast.error('Erro ao salvar configurações');
    }

    setIsSaving(false);
  };

  const handleTestEmail = async () => {
    const savedConfig = getSavedSettings();
    if (!savedConfig) {
      toast.error('Salve as configurações antes de testar');
      return;
    }

    // Double check if current inputs match saved? The prompt says "Ler exclusivamente as configurações atualmente salvas".
    // We strictly use savedConfig.

    setTestStatus('testing');
    setTestError(null);

    const timestamp = new Date().toLocaleString('pt-BR');
    const testBody = `Este é um e-mail de teste.
Se você recebeu esta mensagem, a configuração SMTP do Techub Monitor está funcionando corretamente.
Data/Hora do teste: ${timestamp}`;

    try {
      const { data, error } = await supabase.functions.invoke('test-email', {
        body: {
          host: savedConfig.host,
          port: parseInt(savedConfig.port),
          username: savedConfig.username,
          password: savedConfig.password,
          useSsl: savedConfig.useSsl,
          useTls: savedConfig.useTls,
          recipients: [savedConfig.fromEmail], // Send test email to sender
          fromName: savedConfig.fromName,
          fromEmail: savedConfig.fromEmail
        },
      });

      if (error) {
        throw new Error(error.message || 'Erro na invocação da função');
      }

      if (data?.success) {
        setTestStatus('success');
        setTestDetails(data.details); // Save details from edge function
        toast.success('E-mail de teste enviado com sucesso');
      } else {
        throw new Error(data?.error || data?.message || 'Falha ao enviar e-mail');
      }
    } catch (err: any) {
      console.error(err);
      setTestStatus('error');
      setTestDetails(null);
      const errorMessage = err.message || 'Erro desconhecido';
      setTestError(errorMessage);
      toast.error(`Falha ao enviar e-mail: ${errorMessage}`);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Configurações de Email (SMTP)</h3>
          <p className="text-sm text-muted-foreground">Configure o servidor SMTP para envio de alertas</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* SMTP Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-foreground/80">Servidor de Saída</h4>
            <div className="flex items-center gap-2">
              <Label htmlFor="enabled" className="text-xs">Ativar envios</Label>
              <Switch
                id="enabled"
                checked={settings.enabled}
                onCheckedChange={(c) => setSettings({ ...settings, enabled: c })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp-host">Host SMTP <span className="text-red-500">*</span></Label>
            <Input
              id="smtp-host"
              placeholder="smtp.exemplo.com"
              value={settings.host}
              onChange={(e) => setSettings({ ...settings, host: e.target.value })}
              className={errors.host ? "border-red-500 bg-red-500/10" : "bg-secondary/50"}
            />
            {errors.host && <p className="text-xs text-red-500">{errors.host}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-port">Porta <span className="text-red-500">*</span></Label>
              <Input
                id="smtp-port"
                placeholder="587"
                value={settings.port}
                onChange={(e) => setSettings({ ...settings, port: e.target.value })}
                className={errors.port ? "border-red-500 bg-red-500/10" : "bg-secondary/50"}
              />
              {errors.port && <p className="text-xs text-red-500">{errors.port}</p>}
            </div>
            <div className="space-y-2 flex flex-col justify-end pb-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="use-ssl"
                  checked={settings.useSsl}
                  onCheckedChange={(checked) => setSettings({ ...settings, useSsl: checked, useTls: checked ? false : settings.useTls })}
                />
                <Label htmlFor="use-ssl">SSL (Seguro)</Label>
              </div>
              {/* TLS usually implied if not SSL, or specific */}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp-user">Usuário <span className="text-red-500">*</span></Label>
            <Input
              id="smtp-user"
              placeholder="usuario@exemplo.com"
              value={settings.username}
              onChange={(e) => setSettings({ ...settings, username: e.target.value })}
              className={errors.username ? "border-red-500 bg-red-500/10" : "bg-secondary/50"}
            />
            {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp-pass">Senha <span className="text-red-500">*</span></Label>
            <Input
              id="smtp-pass"
              type="password"
              placeholder="••••••••"
              value={settings.password}
              onChange={(e) => setSettings({ ...settings, password: e.target.value })}
              className={errors.password ? "border-red-500 bg-red-500/10" : "bg-secondary/50"}
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>
        </div>

        {/* Sender & Recipients */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-foreground/80">Remetente e Destinatários</h4>

          <div className="space-y-2">
            <Label htmlFor="from-email">Email do Remetente <span className="text-red-500">*</span></Label>
            <Input
              id="from-email"
              placeholder="alerta@techub.com"
              value={settings.fromEmail}
              onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
              className={errors.fromEmail ? "border-red-500 bg-red-500/10" : "bg-secondary/50"}
            />
            {errors.fromEmail && <p className="text-xs text-red-500">{errors.fromEmail}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="from-name">Nome do Remetente</Label>
            <Input
              id="from-name"
              placeholder="Techub Monitor"
              value={settings.fromName}
              onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
              className="bg-secondary/50"
            />
          </div>

          <div>
            <Label className="mb-2 block">Destinatários dos Alertas</Label>
            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
              {settings.recipients.map((recipient, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="email@exemplo.com"
                    value={recipient}
                    onChange={(e) => handleRecipientChange(index, e.target.value)}
                    className="bg-secondary/50"
                  />
                  {settings.recipients.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRecipient(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddRecipient}
              className="mt-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar destinatário
            </Button>
          </div>
        </div>
      </div>

      {/* Test Email Button */}
      <div className="flex flex-col gap-2 p-4 rounded-lg bg-secondary/30 border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">Testar Configuração</h4>
          </div>
          <Button
            onClick={handleTestEmail}
            disabled={testStatus === 'testing'}
            variant={testStatus === 'error' ? 'destructive' : 'outline'}
            className="flex items-center gap-2 min-w-[140px]"
          >
            {testStatus === 'testing' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : testStatus === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : testStatus === 'error' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {testStatus === 'testing' ? 'Enviando...' : 'Testar envio'}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {testStatus === 'idle' && (
            <p>O teste enviará um email para <strong>{settings.fromEmail || 'o remetente'}</strong> usando as configurações <strong>SALVAS</strong>.</p>
          )}
          {testStatus === 'success' && (
            <div className="space-y-2">
              <p className="text-chart-green font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> E-mail de teste enviado com sucesso
              </p>
              {testDetails && (
                <div className="text-xs font-mono bg-secondary/50 p-2 rounded border border-border/50 break-all">
                  <p><strong>Message ID:</strong> {testDetails.messageId}</p>
                  <p><strong>Response:</strong> {testDetails.response}</p>
                </div>
              )}
            </div>
          )}
          {testStatus === 'error' && (
            <div className="text-chart-red bg-red-500/10 p-2 rounded text-xs mt-1">
              <p className="font-bold flex items-center gap-1"><XCircle className="h-3 w-3" /> Falha ao enviar e-mail</p>
              <p className="mt-1">{testError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Email Template */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h4 className="font-medium">Template do Email</h4>
        <p className="text-sm text-muted-foreground">
          Use as variáveis: <code className="text-primary">{'{{empresa}}'}</code>, <code className="text-primary">{'{{percentual}}'}</code>, <code className="text-primary">{'{{data}}'}</code>
        </p>

        <div className="space-y-2">
          <Label htmlFor="email-subject">Assunto</Label>
          <Input
            id="email-subject"
            value={settings.subject}
            onChange={(e) => setSettings({ ...settings, subject: e.target.value })}
            className="bg-secondary/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-body">Corpo do Email</Label>
          <Textarea
            id="email-body"
            value={settings.body}
            onChange={(e) => setSettings({ ...settings, body: e.target.value })}
            className="bg-secondary/50 min-h-[200px] font-mono text-sm"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 sticky bottom-0 bg-background/80 backdrop-blur pb-4 border-t border-border mt-4">
        <Button onClick={handleSave} disabled={isSaving} size="lg" className="w-full sm:w-auto">
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Salvando...' : 'Salvar configurações'}
        </Button>
      </div>
    </motion.div>
  );
}
