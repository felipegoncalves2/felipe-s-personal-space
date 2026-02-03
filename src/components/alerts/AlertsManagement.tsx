import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, History, Loader2 } from 'lucide-react';
import { AlertSummaryCards } from './AlertSummaryCards';
import { AlertsTable } from './AlertsTable';
import { AlertTreatmentModal } from './AlertTreatmentModal';
import { useAlerts } from '@/hooks/useAlerts';
import { MonitoringAlert } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function AlertsManagement() {
    const { hasPermission } = useAuth();
    const { alerts, isLoading, treatAlert } = useAlerts();
    const [selectedAlert, setSelectedAlert] = useState<MonitoringAlert | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleTreat = (alert: MonitoringAlert) => {
        setSelectedAlert(alert);
        setIsModalOpen(true);
    };

    const onConfirmTreatment = async (comment: string) => {
        if (selectedAlert) {
            await treatAlert(selectedAlert.id, comment);
        }
    };

    if (isLoading && alerts.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Gestão de Alertas</h2>
                    <p className="text-muted-foreground">
                        Escore e tratamento de instâncias capturadas pelos gatilhos automáticos
                    </p>
                </div>
            </div>

            {/* Executive Summary */}
            <AlertSummaryCards alerts={alerts} />

            {/* Main Tabs */}
            <Tabs defaultValue="active" className="space-y-6">
                <TabsList className="glass">
                    <TabsTrigger value="active" className="gap-2">
                        <Bell className="h-4 w-4" />
                        Alertas Ativos
                    </TabsTrigger>
                    {hasPermission('alerts.history') && (
                        <TabsTrigger value="history" className="gap-2">
                            <History className="h-4 w-4" />
                            Histórico
                        </TabsTrigger>
                    )}
                </TabsList>

                <div className="glass rounded-lg p-6">
                    <TabsContent value="active" className="m-0">
                        <AlertsTable
                            alerts={alerts}
                            onTreat={handleTreat}
                            showHistory={false}
                        />
                    </TabsContent>

                    {hasPermission('alerts.history') && (
                        <TabsContent value="history" className="m-0">
                            <AlertsTable
                                alerts={alerts}
                                onTreat={() => { }}
                                showHistory={true}
                            />
                        </TabsContent>
                    )}
                </div>
            </Tabs>

            <AlertTreatmentModal
                alert={selectedAlert}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedAlert(null);
                }}
                onConfirm={onConfirmTreatment}
            />
        </div>
    );
}
