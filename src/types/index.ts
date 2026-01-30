export interface User {
  id: number;
  full_name: string;
  username: string;
  email: string;
  department: string | null;
  role: string;
  role_description?: string;
}

export interface AuthState {
  user: User | null;
  session_token: string | null;
  expires_at: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginResponse {
  success: boolean;
  session_token: string;
  expires_at: string;
  user: User;
  error?: string;
}

export interface ValidateSessionResponse {
  valid: boolean;
  user?: User;
  expires_at?: string;
  error?: string;
}

export interface MonitoringData {
  empresa: string;
  total_base: number;
  total_sem_monitoramento: number;
  data_gravacao: string;
  monitoradas: number;
  percentual: number;
}

export interface SLAData {
  id: number;
  nome: string;
  dentro: number;
  fora: number;
  total: number;
  percentual: number;
  created_at: string;
}

export interface UserListItem {
  id: number;
  full_name: string;
  username: string;
  email: string;
  department: string | null;
  is_active: boolean;
  created_at: string;
  role: string;
  role_description?: string;
}

export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface PresentationSettings {
  id: string;
  companies_per_page: number;
  interval_seconds: number;
  min_percentage: number | null;
  max_percentage: number | null;
  ignore_green: boolean;
  ignore_yellow: boolean;
  ignore_red: boolean;
  created_at: string;
  updated_at: string;
}

export type MonitoringTabType = 'mps' | 'sla-fila' | 'sla-projetos';
