import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Plus, Trash2, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface EmailConfig {
  host: string;
  port: string;
  username: string;
  password: string;
  useTls: boolean;
  useSsl: boolean;
  recipients: string[];
  subject: string;
  body: string;
}

const DEFAULT_EMAIL_CONFIG: EmailConfig = {
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
};

export function EmailSettings() {
  const [config, setConfig] = useState<EmailConfig>(DEFAULT_EMAIL_CONFIG);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddRecipient = () => {
    setConfig((prev) => ({
      ...prev,
      recipients: [...prev.recipients, ''],
    }));
  };

  const handleRemoveRecipient = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index),
    }));
  };

  const handleRecipientChange = (index: number, value: string) => {
    setConfig((prev) => ({
      ...prev,
      recipients: prev.recipients.map((r, i) => (i === index ? value : r)),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simular salvamento
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success('Configurações de email salvas com sucesso!');
    setIsSaving(false);
  };

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
          <div className="space-y-2">
            <Label htmlFor="smtp-host">Host SMTP</Label>
            <Input
              id="smtp-host"
              placeholder="smtp.exemplo.com"
              value={config.host}
              onChange={(e) => setConfig({ ...config, host: e.target.value })}
              className="bg-secondary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp-port">Porta</Label>
            <Input
              id="smtp-port"
              placeholder="587"
              value={config.port}
              onChange={(e) => setConfig({ ...config, port: e.target.value })}
              className="bg-secondary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp-user">Usuário</Label>
            <Input
              id="smtp-user"
              placeholder="usuario@exemplo.com"
              value={config.username}
              onChange={(e) => setConfig({ ...config, username: e.target.value })}
              className="bg-secondary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp-pass">Senha</Label>
            <Input
              id="smtp-pass"
              type="password"
              placeholder="••••••••"
              value={config.password}
              onChange={(e) => setConfig({ ...config, password: e.target.value })}
              className="bg-secondary/50"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Switch
                id="use-tls"
                checked={config.useTls}
                onCheckedChange={(checked) => setConfig({ ...config, useTls: checked, useSsl: checked ? false : config.useSsl })}
              />
              <Label htmlFor="use-tls">TLS</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="use-ssl"
                checked={config.useSsl}
                onCheckedChange={(checked) => setConfig({ ...config, useSsl: checked, useTls: checked ? false : config.useTls })}
              />
              <Label htmlFor="use-ssl">SSL</Label>
            </div>
          </div>
        </div>

        {/* Recipients */}
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Destinatários</Label>
            <div className="space-y-2">
              {config.recipients.map((recipient, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="email@exemplo.com"
                    value={recipient}
                    onChange={(e) => handleRecipientChange(index, e.target.value)}
                    className="bg-secondary/50"
                  />
                  {config.recipients.length > 1 && (
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
            value={config.subject}
            onChange={(e) => setConfig({ ...config, subject: e.target.value })}
            className="bg-secondary/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-body">Corpo do Email</Label>
          <Textarea
            id="email-body"
            value={config.body}
            onChange={(e) => setConfig({ ...config, body: e.target.value })}
            className="bg-secondary/50 min-h-[200px] font-mono text-sm"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Salvando...' : 'Salvar configurações'}
        </Button>
      </div>
    </motion.div>
  );
}
