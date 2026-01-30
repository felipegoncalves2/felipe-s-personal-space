import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Settings, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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
  activeTab: 'monitoring' | 'settings';
  onTabChange: (tab: 'monitoring' | 'settings') => void;
}

export function DashboardLayout({ children, activeTab, onTabChange }: DashboardLayoutProps) {
  const { user, logout, isAdmin } = useAuth();

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
              <Button
                variant={activeTab === 'monitoring' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onTabChange('monitoring')}
                className="gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Monitoramento</span>
              </Button>

              {isAdmin && (
                <Button
                  variant={activeTab === 'settings' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => onTabChange('settings')}
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
