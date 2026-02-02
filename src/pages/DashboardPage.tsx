import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MonitoringGrid } from '@/components/monitoring/MonitoringGrid';
import { SLAGrid } from '@/components/monitoring/SLAGrid';
import { EmailSettings } from '@/components/settings/EmailSettings';
import { SupabaseSettings } from '@/components/settings/SupabaseSettings';
import { UsersTable } from '@/components/settings/UsersTable';
import { PresentationSettings } from '@/components/settings/PresentationSettings';
import { AlertSettings } from '@/components/settings/AlertSettings';
import { useAuth } from '@/contexts/AuthContext';
import { MonitoringTabType } from '@/types';

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'monitoring' | 'settings'>('monitoring');
  const [monitoringTab, setMonitoringTab] = useState<MonitoringTabType>('mps');

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Monitoramento</h2>
            <p className="text-muted-foreground">
              Acompanhe o status de monitoramento em tempo real
            </p>
          </div>

          {/* Monitoring sub-tabs */}
          <Tabs value={monitoringTab} onValueChange={(v) => setMonitoringTab(v as MonitoringTabType)}>
            <TabsList className="glass">
              <TabsTrigger value="mps">MPS</TabsTrigger>
              <TabsTrigger value="sla-fila">SLA Fila RN</TabsTrigger>
              <TabsTrigger value="sla-projetos">SLA Projetos RN</TabsTrigger>
            </TabsList>

            <TabsContent value="mps" className="mt-6">
              <MonitoringGrid />
            </TabsContent>

            <TabsContent value="sla-fila" className="mt-6">
              <SLAGrid type="fila" />
            </TabsContent>

            <TabsContent value="sla-projetos" className="mt-6">
              <SLAGrid type="projetos" />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {activeTab === 'settings' && isAdmin && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Configurações</h2>
            <p className="text-muted-foreground">
              Gerencie as configurações do sistema
            </p>
          </div>

          <Tabs defaultValue="alerts" className="space-y-6">
            <TabsList className="glass">
              <TabsTrigger value="alerts">Alertas</TabsTrigger>
              <TabsTrigger value="email">Email (SMTP)</TabsTrigger>
              <TabsTrigger value="supabase">Supabase</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="presentation">Apresentação</TabsTrigger>
            </TabsList>

            <div className="glass rounded-lg p-6">
              <TabsContent value="alerts" className="m-0">
                <AlertSettings />
              </TabsContent>

              <TabsContent value="email" className="m-0">
                <EmailSettings />
              </TabsContent>

              <TabsContent value="supabase" className="m-0">
                <SupabaseSettings />
              </TabsContent>

              <TabsContent value="users" className="m-0">
                <UsersTable />
              </TabsContent>

              <TabsContent value="presentation" className="m-0">
                <PresentationSettings />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
    </DashboardLayout>
  );
}
