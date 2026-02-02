import { useState, useEffect } from 'react';
import { Save, Loader2, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePresentationSettings } from '@/hooks/usePresentationSettings';
import { MonitoringTypeKey } from '@/types';
import { toast } from 'sonner';

const COMPANIES_PER_PAGE_OPTIONS = [4, 5, 10, 20, 30];

interface TabConfig {
  key: MonitoringTypeKey;
  label: string;
}

const TABS: TabConfig[] = [
  { key: 'mps', label: 'MPS' },
  { key: 'sla_fila', label: 'SLA Fila RN' },
  { key: 'sla_projetos', label: 'SLA Projetos RN' },
];

function PresentationSettingsForm({ monitoringType }: { monitoringType: MonitoringTypeKey }) {
  const { settings, isLoading, updateSettings } = usePresentationSettings(monitoringType);
  const [isSaving, setIsSaving] = useState(false);

  const [companiesPerPage, setCompaniesPerPage] = useState(4);
  const [intervalSeconds, setIntervalSeconds] = useState(10);
  const [minPercentage, setMinPercentage] = useState<string>('');
  const [maxPercentage, setMaxPercentage] = useState<string>('');
  const [ignoreGreen, setIgnoreGreen] = useState(false);
  const [ignoreYellow, setIgnoreYellow] = useState(false);
  const [ignoreRed, setIgnoreRed] = useState(false);
  const [thresholdExcellent, setThresholdExcellent] = useState(98);
  const [thresholdAttention, setThresholdAttention] = useState(80);
  const [thresholdCritical, setThresholdCritical] = useState(80);

  useEffect(() => {
    if (settings) {
      setCompaniesPerPage(settings.companies_per_page);
      setIntervalSeconds(settings.interval_seconds);
      setMinPercentage(settings.min_percentage?.toString() || '');
      setMaxPercentage(settings.max_percentage?.toString() || '');
      setIgnoreGreen(settings.ignore_green);
      setIgnoreYellow(settings.ignore_yellow);
      setIgnoreRed(settings.ignore_red);
      setThresholdExcellent(settings.threshold_excellent ?? 98);
      setThresholdAttention(settings.threshold_attention ?? 80);
      setThresholdCritical(settings.threshold_critical ?? 80);
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateSettings({
        companies_per_page: companiesPerPage,
        interval_seconds: intervalSeconds,
        min_percentage: minPercentage ? parseFloat(minPercentage) : null,
        max_percentage: maxPercentage ? parseFloat(maxPercentage) : null,
        ignore_green: ignoreGreen,
        ignore_yellow: ignoreYellow,
        ignore_red: ignoreRed,
        threshold_excellent: thresholdExcellent,
        threshold_attention: thresholdAttention,
        threshold_critical: thresholdCritical,
      });

      if (result.success) {
        toast.success('Configurações salvas com sucesso!');
      } else {
        toast.error(result.error || 'Erro ao salvar configurações');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Layout Section */}
      <div className="space-y-4">
        <h4 className="font-medium text-foreground border-b border-border pb-2">
          📐 Layout
        </h4>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`companies-per-page-${monitoringType}`}>Empresas por tela</Label>
            <Select
              value={companiesPerPage.toString()}
              onValueChange={(value) => setCompaniesPerPage(parseInt(value))}
            >
              <SelectTrigger id={`companies-per-page-${monitoringType}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPANIES_PER_PAGE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n} itens
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Timing Section */}
      <div className="space-y-4">
        <h4 className="font-medium text-foreground border-b border-border pb-2">
          ⏱️ Tempo
        </h4>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`interval-seconds-${monitoringType}`}>Intervalo entre páginas (segundos)</Label>
            <Input
              id={`interval-seconds-${monitoringType}`}
              type="number"
              min={3}
              max={120}
              value={intervalSeconds}
              onChange={(e) => setIntervalSeconds(Math.max(3, parseInt(e.target.value) || 10))}
              className="bg-secondary/50"
            />
            <p className="text-xs text-muted-foreground">Mínimo: 3s | Máximo: 120s</p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="space-y-4">
        <h4 className="font-medium text-foreground border-b border-border pb-2">
          🎯 Filtros
        </h4>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`min-percentage-${monitoringType}`}>Ignorar itens com % abaixo de</Label>
            <Input
              id={`min-percentage-${monitoringType}`}
              type="number"
              min={0}
              max={100}
              step={0.1}
              placeholder="Ex: 50"
              value={minPercentage}
              onChange={(e) => setMinPercentage(e.target.value)}
              className="bg-secondary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`max-percentage-${monitoringType}`}>Ignorar itens com % acima de</Label>
            <Input
              id={`max-percentage-${monitoringType}`}
              type="number"
              min={0}
              max={100}
              step={0.1}
              placeholder="Ex: 98"
              value={maxPercentage}
              onChange={(e) => setMaxPercentage(e.target.value)}
              className="bg-secondary/50"
            />
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <Label className="text-base">Ignorar por status</Label>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <Switch
                id={`ignore-green-${monitoringType}`}
                checked={ignoreGreen}
                onCheckedChange={setIgnoreGreen}
              />
              <Label htmlFor={`ignore-green-${monitoringType}`} className="cursor-pointer">
                🟢 Verde (Excluir)
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id={`ignore-yellow-${monitoringType}`}
                checked={ignoreYellow}
                onCheckedChange={setIgnoreYellow}
              />
              <Label htmlFor={`ignore-yellow-${monitoringType}`} className="cursor-pointer">
                🟡 Amarelo (Excluir)
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id={`ignore-red-${monitoringType}`}
                checked={ignoreRed}
                onCheckedChange={setIgnoreRed}
              />
              <Label htmlFor={`ignore-red-${monitoringType}`} className="cursor-pointer">
                🔴 Vermelho (Excluir)
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* Thresholds Section */}
      <div className="space-y-4">
        <h4 className="font-medium text-foreground border-b border-border pb-2">
          🎨 Faixas de Cor
        </h4>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor={`threshold-excellent-${monitoringType}`}>Mínimo para Excelente 🟢</Label>
            <Input
              id={`threshold-excellent-${monitoringType}`}
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={thresholdExcellent}
              onChange={(e) => setThresholdExcellent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
              className="bg-secondary/50 border-chart-green/50 focus:border-chart-green"
            />
            <p className="text-xs text-muted-foreground">Padrão: 98%</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`threshold-attention-${monitoringType}`}>Mínimo para Atenção 🟡</Label>
            <Input
              id={`threshold-attention-${monitoringType}`}
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={thresholdAttention}
              onChange={(e) => setThresholdAttention(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
              className="bg-secondary/50 border-chart-yellow/50 focus:border-chart-yellow"
            />
            <p className="text-xs text-muted-foreground">Padrão: 80%</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`threshold-critical-${monitoringType}`}>Máximo para Crítico 🔴</Label>
            <Input
              id={`threshold-critical-${monitoringType}`}
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={thresholdCritical}
              onChange={(e) => setThresholdCritical(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
              className="bg-secondary/50 border-chart-red/50 focus:border-chart-red"
            />
            <p className="text-xs text-muted-foreground">Padrão: 80%</p>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-border">
          <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Configurações
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PresentationSettings() {
  const [activeTab, setActiveTab] = useState<MonitoringTypeKey>('mps');

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Monitor className="h-6 w-6 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Configurações da Apresentação</h3>
          <p className="text-sm text-muted-foreground">
            Configure o modo de apresentação para cada tipo de monitoramento
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MonitoringTypeKey)} className="space-y-6">
        <TabsList className="glass">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.key} value={tab.key} className="m-0">
            <PresentationSettingsForm monitoringType={tab.key} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
