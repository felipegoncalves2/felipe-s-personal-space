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
import { RolesTable } from '@/components/settings/RolesTable';
import { useAuth } from '@/contexts/AuthContext';
import { MonitoringTabType } from '@/types';
import { ReportsPage } from './ReportsPage';
import { AlertsManagement } from '@/components/alerts/AlertsManagement';
import { SLAAnalysis } from '@/components/sla-analysis/SLAAnalysis';

export default function DashboardPage() {
  const { isAdmin, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'monitoring' | 'analysis' | 'reports' | 'alerts' | 'settings'>('monitoring');
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
              {hasPermission('monitoring.view_mps') && <TabsTrigger value="mps">MPS</TabsTrigger>}
              {hasPermission('monitoring.view_sla_fila') && <TabsTrigger value="sla-fila">SLA Fila RN</TabsTrigger>}
              {hasPermission('monitoring.view_sla_projetos') && <TabsTrigger value="sla-projetos">SLA Projetos RN</TabsTrigger>}
            </TabsList>

            {hasPermission('monitoring.view_mps') && (
              <TabsContent value="mps" className="mt-6">
                <MonitoringGrid />
              </TabsContent>
            )}

            {hasPermission('monitoring.view_sla_fila') && (
              <TabsContent value="sla-fila" className="mt-6">
                <SLAGrid type="fila" />
              </TabsContent>
            )}

            {hasPermission('monitoring.view_sla_projetos') && (
              <TabsContent value="sla-projetos" className="mt-6">
                <SLAGrid type="projetos" />
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}

      {activeTab === 'analysis' && hasPermission('monitoring.view_sla_fila') && (
        <SLAAnalysis />
      )}

      {activeTab === 'reports' && hasPermission('reports.view') && (
        <ReportsPage />
      )}

      {activeTab === 'alerts' && hasPermission('alerts.view') && (
        <AlertsManagement />
      )}

      {activeTab === 'settings' && (isAdmin || hasPermission('roles.view') || hasPermission('users.view')) && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Configurações</h2>
            <p className="text-muted-foreground">
              Gerencie as configurações do sistema
            </p>
          </div>

          <Tabs defaultValue="alerts" className="space-y-6">
            <TabsList className="glass">
              {hasPermission('settings.alerts') && <TabsTrigger value="alerts">Alertas</TabsTrigger>}
              {hasPermission('settings.smtp') && <TabsTrigger value="email">Email (SMTP)</TabsTrigger>}
              {hasPermission('settings.integrations') && <TabsTrigger value="supabase">Supabase</TabsTrigger>}
              {hasPermission('users.view') && <TabsTrigger value="users">Usuários</TabsTrigger>}
              {hasPermission('roles.view') && <TabsTrigger value="roles">Roles e Permissões</TabsTrigger>}
              {hasPermission('settings.presentation') && <TabsTrigger value="presentation">Apresentação</TabsTrigger>}
            </TabsList>

            <div className="glass rounded-lg p-6">
              {hasPermission('settings.alerts') && (
                <TabsContent value="alerts" className="m-0">
                  <AlertSettings />
                </TabsContent>
              )}

              {hasPermission('settings.smtp') && (
                <TabsContent value="email" className="m-0">
                  <EmailSettings />
                </TabsContent>
              )}

              {hasPermission('settings.integrations') && (
                <TabsContent value="supabase" className="m-0">
                  <SupabaseSettings />
                </TabsContent>
              )}

              {hasPermission('users.view') && (
                <TabsContent value="users" className="m-0">
                  <UsersTable />
                </TabsContent>
              )}

              {hasPermission('roles.view') && (
                <TabsContent value="roles" className="m-0">
                  <RolesTable />
                </TabsContent>
              )}

              {hasPermission('settings.presentation') && (
                <TabsContent value="presentation" className="m-0">
                  <PresentationSettings />
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      )}
    </DashboardLayout>
  );
}
