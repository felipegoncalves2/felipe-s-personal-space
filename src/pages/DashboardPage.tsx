import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MonitoringGrid } from '@/components/monitoring/MonitoringGrid';
import { EmailSettings } from '@/components/settings/EmailSettings';
import { SupabaseSettings } from '@/components/settings/SupabaseSettings';
import { UsersTable } from '@/components/settings/UsersTable';
import { PresentationSettings } from '@/components/settings/PresentationSettings';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'monitoring' | 'settings'>('monitoring');

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Monitoramento</h2>
            <p className="text-muted-foreground">
              Acompanhe o status de monitoramento das empresas em tempo real
            </p>
          </div>
          <MonitoringGrid />
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

          <Tabs defaultValue="email" className="space-y-6">
            <TabsList className="glass">
              <TabsTrigger value="email">Email (SMTP)</TabsTrigger>
              <TabsTrigger value="supabase">Supabase</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="presentation">Apresentação</TabsTrigger>
            </TabsList>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-lg p-6"
            >
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
            </motion.div>
          </Tabs>
        </div>
      )}
    </DashboardLayout>
  );
}
