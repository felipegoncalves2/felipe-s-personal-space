import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Settings, LogOut, User, BarChart2, Bell, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import techubLogo from '@/assets/logo_techub.jpg';

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: 'monitoring' | 'analysis' | 'reports' | 'alerts' | 'settings' | 'backlog';
  onTabChange: (tab: 'monitoring' | 'analysis' | 'reports' | 'alerts' | 'settings' | 'backlog') => void;
}

export function DashboardLayout({ children, activeTab, onTabChange }: DashboardLayoutProps) {
  const { user, logout, isAdmin, hasPermission } = useAuth();

  // Permission Groups
  const canViewMonitoring = hasPermission('VIEW_MPS') || hasPermission('VIEW_SLA_FILA') || hasPermission('VIEW_SLA_PROJETO');
  const canViewAnalysis = hasPermission('VIEW_SLA_ANALYSIS') || hasPermission('EXPORT_SLA_ANALYSIS');
  const canViewReports = hasPermission('VIEW_REPORTS') || hasPermission('EXPORT_REPORTS');
  const canViewAlerts = hasPermission('CONFIG_ALERTS') || isAdmin; // Keeping admin fallback for now
  const canViewSettings = hasPermission('CONFIG_ALERTS') ||
    hasPermission('CONFIG_PRESENTATION') ||
    hasPermission('CONFIG_SMTP') ||
    hasPermission('CONFIG_METAS') ||
    hasPermission('CONFIG_ROLES');

  const navigate = useNavigate();

  const handleTabChange = (tab: 'monitoring' | 'analysis' | 'reports' | 'alerts' | 'settings' | 'backlog') => {
    onTabChange(tab);
    switch (tab) {
      case 'monitoring':
        navigate('/monitoramento');
        break;
      case 'analysis':
        navigate('/analise-sla');
        break;
      case 'reports':
        navigate('/relatorios');
        break;
      case 'alerts':
        navigate('/alertas');
        break;
      case 'settings':
        navigate('/configuracoes');
        break;
      case 'backlog':
        navigate('/backlog');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src={techubLogo}
                alt="TECHUB"
                className="h-8 w-auto object-contain"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-foreground">
                  TECHUB <span className="text-primary">Monitor</span>
                </h1>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              {canViewMonitoring && (
                <Button
                  variant={activeTab === 'monitoring' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => handleTabChange('monitoring')}
                  className="gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Monitoramento</span>
                </Button>
              )}

              <Button
                variant={activeTab === 'backlog' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleTabChange('backlog')}
                className="gap-2"
              >
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Backlog</span>
              </Button>

              {canViewAnalysis && (
                <Button
                  variant={activeTab === 'analysis' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => handleTabChange('analysis')}
                  className="gap-2"
                >
                  <BarChart2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Análise de SLA</span>
                </Button>
              )}

              {canViewReports && (
                <Button
                  variant={activeTab === 'reports' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => handleTabChange('reports')}
                  className="gap-2"
                >
                  <BarChart2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Relatórios</span>
                </Button>
              )}

              {canViewAlerts && (
                <Button
                  variant={activeTab === 'alerts' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => handleTabChange('alerts')}
                  className="gap-2"
                >
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Gestão de Alertas</span>
                </Button>
              )}

              {canViewSettings && (
                <Button
                  variant={activeTab === 'settings' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => handleTabChange('settings')}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Configurações</span>
                </Button>
              )}
            </nav>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="hidden md:inline text-sm font-medium">
                    {user?.full_name?.split(' ')[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">{user?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-muted-foreground">
                  <span className="text-xs">Role: {user?.role}</span>
                </DropdownMenuItem>
                {user?.department && (
                  <DropdownMenuItem className="text-muted-foreground">
                    <span className="text-xs">Dept: {user.department}</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-auto">
        <div className="container mx-auto px-4">
          <p className="text-center text-xs text-muted-foreground">
            © 2026 TECHUB Monitor. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
