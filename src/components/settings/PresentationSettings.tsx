import { useState, useEffect } from 'react';
import { Save, Loader2, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePresentationSettings } from '@/hooks/usePresentationSettings';
import { toast } from 'sonner';

const COMPANIES_PER_PAGE_OPTIONS = [4, 5, 10, 20, 30];

export function PresentationSettings() {
  const { settings, isLoading, updateSettings } = usePresentationSettings();
  const [isSaving, setIsSaving] = useState(false);

  const [companiesPerPage, setCompaniesPerPage] = useState(4);
  const [intervalSeconds, setIntervalSeconds] = useState(10);
  const [minPercentage, setMinPercentage] = useState<string>('');
  const [maxPercentage, setMaxPercentage] = useState<string>('');
  const [ignoreGreen, setIgnoreGreen] = useState(false);
  const [ignoreYellow, setIgnoreYellow] = useState(false);
  const [ignoreRed, setIgnoreRed] = useState(false);

  useEffect(() => {
    if (settings) {
      setCompaniesPerPage(settings.companies_per_page);
      setIntervalSeconds(settings.interval_seconds);
      setMinPercentage(settings.min_percentage?.toString() || '');
      setMaxPercentage(settings.max_percentage?.toString() || '');
      setIgnoreGreen(settings.ignore_green);
      setIgnoreYellow(settings.ignore_yellow);
      setIgnoreRed(settings.ignore_red);
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
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Monitor className="h-6 w-6 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Configurações da Apresentação</h3>
          <p className="text-sm text-muted-foreground">
            Configure o modo de apresentação para exibição em TVs e salas de monitoramento
          </p>
        </div>
      </div>

      {/* Layout Section */}
      <div className="space-y-4">
        <h4 className="font-medium text-foreground border-b border-border pb-2">
          📐 Layout
        </h4>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companies-per-page">Empresas por tela</Label>
            <Select
              value={companiesPerPage.toString()}
              onValueChange={(value) => setCompaniesPerPage(parseInt(value))}
            >
              <SelectTrigger id="companies-per-page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPANIES_PER_PAGE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n} empresas
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
            <Label htmlFor="interval-seconds">Intervalo entre páginas (segundos)</Label>
            <Input
              id="interval-seconds"
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
            <Label htmlFor="min-percentage">Ignorar empresas com % abaixo de</Label>
            <Input
              id="min-percentage"
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
            <Label htmlFor="max-percentage">Ignorar empresas com % acima de</Label>
            <Input
              id="max-percentage"
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
                id="ignore-green"
                checked={ignoreGreen}
                onCheckedChange={setIgnoreGreen}
              />
              <Label htmlFor="ignore-green" className="cursor-pointer">
                🟢 Verde (≥98%)
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="ignore-yellow"
                checked={ignoreYellow}
                onCheckedChange={setIgnoreYellow}
              />
              <Label htmlFor="ignore-yellow" className="cursor-pointer">
                🟡 Amarelo (80-97.9%)
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="ignore-red"
                checked={ignoreRed}
                onCheckedChange={setIgnoreRed}
              />
              <Label htmlFor="ignore-red" className="cursor-pointer">
                🔴 Vermelho (&lt;80%)
              </Label>
            </div>
          </div>
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
  );
}
