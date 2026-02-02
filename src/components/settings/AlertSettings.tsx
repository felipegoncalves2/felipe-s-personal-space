import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Save, HelpCircle, Activity, TrendingDown, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from 'sonner';
import { useAlertSettings, AlertMonitoringType, AlertSettings as IAlertSettings } from '@/hooks/useAlertSettings';

export function AlertSettings() {
    const [activeTab, setActiveTab] = useState<AlertMonitoringType>('mps');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold">Configurações de Alertas</h3>
                    <p className="text-sm text-muted-foreground">Governança dos parâmetros de anomalia e tendências</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AlertMonitoringType)} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="mps">MPS</TabsTrigger>
                    <TabsTrigger value="sla_fila">SLA Fila RN</TabsTrigger>
                    <TabsTrigger value="sla_projeto">SLA Projetos RN</TabsTrigger>
                </TabsList>

                <TabsContent value="mps">
                    <AlertForm type="mps" />
                </TabsContent>
                <TabsContent value="sla_fila">
                    <AlertForm type="sla_fila" />
                </TabsContent>
                <TabsContent value="sla_projeto">
                    <AlertForm type="sla_projeto" />
                </TabsContent>
            </Tabs>
        </motion.div>
    );
}

function AlertForm({ type }: { type: AlertMonitoringType }) {
    const { settings, isLoading, saveSettings } = useAlertSettings(type);
    const [localSettings, setLocalSettings] = useState<IAlertSettings | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (settings) {
            setLocalSettings(settings); // Sync with fetched settings
        }
    }, [settings]);

    const handleSave = async () => {
        if (!localSettings) return;
        setIsSaving(true);
        const success = await saveSettings(localSettings);
        if (success) {
            toast.success('Configurações salvas com sucesso');
        }
        setIsSaving(false);
    };

    if (isLoading || !localSettings) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando configurações...</div>;
    }

    // Hardcoded limits for display only (as per requirement)
    // Assuming typical limits: Green >= 98, Red < 80.
    const limits = { green: '≥ 98%', yellow: '80% - 97%', red: '< 80%' };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">

            {/* 1. Anomaly Settings */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                    <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <h4 className="font-medium">Anomalia Estatística</h4>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor={`anomaly-enabled-${type}`} className="text-xs text-muted-foreground">Ativar detecção</Label>
                        <Switch
                            id={`anomaly-enabled-${type}`}
                            checked={localSettings.anomaly_enabled}
                            onCheckedChange={(c) => setLocalSettings({ ...localSettings, anomaly_enabled: c })}
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Label>Período da Média Móvel (dias)</Label>
                            <HelpTooltip text="Número de dias anteriores usados para calcular a média de referência." />
                        </div>
                        <Input
                            type="number"
                            value={localSettings.anomaly_moving_avg_days}
                            onChange={(e) => setLocalSettings({ ...localSettings, anomaly_moving_avg_days: parseInt(e.target.value) || 0 })}
                            className="bg-secondary/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Label>Multiplicador do Desvio Padrão</Label>
                            <HelpTooltip text="Sensibilidade: Quanto maior, menos sensível. Define o quão longe da média um valor deve estar para ser anomalia (Ex: 2 = 2x desvio padrão)." />
                        </div>
                        <Input
                            type="number"
                            step="0.1"
                            value={localSettings.anomaly_stddev_multiplier}
                            onChange={(e) => setLocalSettings({ ...localSettings, anomaly_stddev_multiplier: parseFloat(e.target.value) || 0 })}
                            className="bg-secondary/50"
                        />
                    </div>
                </div>
            </div>

            {/* 2. Trend Settings */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                    <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-primary" />
                        <h4 className="font-medium">Alerta por Tendência</h4>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor={`trend-enabled-${type}`} className="text-xs text-muted-foreground">Ativar alerta</Label>
                        <Switch
                            id={`trend-enabled-${type}`}
                            checked={localSettings.trend_enabled}
                            onCheckedChange={(c) => setLocalSettings({ ...localSettings, trend_enabled: c })}
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-1 gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Label>Períodos Consecutivos em Queda</Label>
                            <HelpTooltip text="Quantas coletas seguidas com valor decrescente disparam um alerta de tendência." />
                        </div>
                        <Input
                            type="number"
                            value={localSettings.trend_consecutive_periods}
                            onChange={(e) => setLocalSettings({ ...localSettings, trend_consecutive_periods: parseInt(e.target.value) || 0 })}
                            className="bg-secondary/50 max-w-[200px]"
                        />
                    </div>
                </div>
            </div>

            {/* 3. Limit Settings (Read -only) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-primary" />
                        <h4 className="font-medium">Limites Críticos (Regra de Negócio)</h4>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                        <span className="text-xs text-green-500 font-bold uppercase block mb-1">Ideal</span>
                        <span className="text-lg font-mono text-green-400">{limits.green}</span>
                    </div>
                    <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
                        <span className="text-xs text-yellow-500 font-bold uppercase block mb-1">Atenção</span>
                        <span className="text-lg font-mono text-yellow-400">{limits.yellow}</span>
                    </div>
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                        <span className="text-xs text-red-500 font-bold uppercase block mb-1">Crítico</span>
                        <span className="text-lg font-mono text-red-400">{limits.red}</span>
                    </div>
                </div>
            </div>

            {/* 4. Auto Resolve */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <h4 className="font-medium">Resolução Automática</h4>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor={`resolve-enabled-${type}`} className="text-xs text-muted-foreground">Permitir resolução</Label>
                        <Switch
                            id={`resolve-enabled-${type}`}
                            checked={localSettings.auto_resolve_enabled}
                            onCheckedChange={(c) => setLocalSettings({ ...localSettings, auto_resolve_enabled: c })}
                        />
                    </div>
                </div>
                <div className="grid md:grid-cols-1 gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Label>Leituras Consecutivas para Resolução</Label>
                            <HelpTooltip text="Quantas coletas normais consecutivas são necessárias para encerrar um alerta automaticamente." />
                        </div>
                        <Input
                            type="number"
                            value={localSettings.auto_resolve_consecutive_readings}
                            onChange={(e) => setLocalSettings({ ...localSettings, auto_resolve_consecutive_readings: parseInt(e.target.value) || 0 })}
                            className="bg-secondary/50 max-w-[200px]"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4 sticky bottom-0 bg-background/80 backdrop-blur pb-4 border-t border-border">
                <Button onClick={handleSave} disabled={isSaving} size="lg">
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Salvando...' : 'Salvar configurações'}
                </Button>
            </div>
        </div>
    );
}

function HelpTooltip({ text }: { text: string }) {
    return (
        <TooltipProvider>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                </TooltipTrigger>
                <TooltipContent>
                    <p className="max-w-xs">{text}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
