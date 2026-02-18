import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthState, LoginResponse, ValidateSessionResponse } from '@/types';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = 'https://qromvrzqktrfexbnaoem.supabase.co';
const SESSION_KEY = 'techub_session';

interface AuthContextType extends AuthState {
  login: (loginId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const fetchPermissions = async (roleName: string) => {
  if (roleName === 'ADM') return []; // Admin has all permissions implicitly

  try {
    const { data: roleData } = await supabase
      .from('roles')
      .select('id, role_permissions(permission_key)')
      .eq('name', roleName)
      .single();

    if (roleData?.role_permissions) {
      return (roleData.role_permissions as any[]).map((p: any) => p.permission_key);
    }
  } catch (error) {
    console.error('Error fetching permissions:', error);
  }
  return [];
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session_token: null,
    expires_at: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const validateSession = useCallback(async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/validate-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: token }),
      });

      const data: ValidateSessionResponse = await response.json();

      if (data.valid && data.user) {
        const permissions = await fetchPermissions(data.user.role);
        const userWithPermissions = { ...data.user, permissions };

        setAuthState({
          user: userWithPermissions,
          session_token: token,
          expires_at: data.expires_at || null,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }

      // Clear invalid session
      localStorage.removeItem(SESSION_KEY);
      setAuthState({
        user: null,
        session_token: null,
        expires_at: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return false;
    } catch (error) {
      console.error('Session validation error:', error);
      localStorage.removeItem(SESSION_KEY);
      setAuthState({
        user: null,
        session_token: null,
        expires_at: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return false;
    }
  }, []);

  useEffect(() => {
    const storedSession = localStorage.getItem(SESSION_KEY);
    if (storedSession) {
      try {
        const { session_token } = JSON.parse(storedSession);
        if (session_token) {
          validateSession(session_token);
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, [validateSession]);

  // Silent ping to keep session active (verify revoked status)
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.session_token) return;

    const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes
    const interval = setInterval(() => {
      // Validate session without blocking UI
      validateSession(authState.session_token!).catch(err => console.error('Ping failed:', err));
    }, PING_INTERVAL);

    return () => clearInterval(interval);
  }, [authState.isAuthenticated, authState.session_token, validateSession]);

  const login = async (loginId: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: loginId, password }),
      });

      const data: LoginResponse = await response.json();

      if (data.success && data.user) {
        const permissions = await fetchPermissions(data.user.role);
        const userWithPermissions = { ...data.user, permissions };

        localStorage.setItem(SESSION_KEY, JSON.stringify({
          session_token: data.session_token,
          expires_at: data.expires_at,
        }));

        setAuthState({
          user: userWithPermissions,
          session_token: data.session_token,
          expires_at: data.expires_at,
          isAuthenticated: true,
          isLoading: false,
        });

        return { success: true };
      }

      return { success: false, error: data.error || 'Erro ao fazer login' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  };

  const logout = async () => {
    try {
      if (authState.session_token) {
        await fetch(`${SUPABASE_URL}/functions/v1/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_token: authState.session_token }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem(SESSION_KEY);
      setAuthState({
        user: null,
        session_token: null,
        expires_at: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const isAdmin = authState.user?.role === 'ADM';

  const hasPermission = useCallback((permission: string) => {
    if (isAdmin) return true; // ADM always has all permissions
    return authState.user?.permissions?.includes(permission) || false;
  }, [isAdmin, authState.user?.permissions]);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, isAdmin, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
