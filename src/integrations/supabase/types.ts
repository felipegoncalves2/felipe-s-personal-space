export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      monitoramento_parque: {
        Row: {
          data_gravacao: string
          empresa: string
          id: string
          total_base: string
          total_sem_monitoramento: string
        }
        Insert: {
          data_gravacao?: string
          empresa: string
          id?: string
          total_base: string
          total_sem_monitoramento: string
        }
        Update: {
          data_gravacao?: string
          empresa?: string
          id?: string
          total_base?: string
          total_sem_monitoramento?: string
        }
        Relationships: []
      }
      monitoring_alert_settings: {
        Row: {
          anomaly_enabled: boolean
          anomaly_moving_avg_days: number
          anomaly_stddev_multiplier: number
          auto_resolve_consecutive_readings: number
          auto_resolve_enabled: boolean
          created_at: string
          id: string
          tipo_monitoramento: string
          trend_consecutive_periods: number
          trend_enabled: boolean
          updated_at: string
        }
        Insert: {
          anomaly_enabled?: boolean
          anomaly_moving_avg_days?: number
          anomaly_stddev_multiplier?: number
          auto_resolve_consecutive_readings?: number
          auto_resolve_enabled?: boolean
          created_at?: string
          id?: string
          tipo_monitoramento: string
          trend_consecutive_periods?: number
          trend_enabled?: boolean
          updated_at?: string
        }
        Update: {
          anomaly_enabled?: boolean
          anomaly_moving_avg_days?: number
          anomaly_stddev_multiplier?: number
          auto_resolve_consecutive_readings?: number
          auto_resolve_enabled?: boolean
          created_at?: string
          id?: string
          tipo_monitoramento?: string
          trend_consecutive_periods?: number
          trend_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      presentation_settings: {
        Row: {
          companies_per_page: number
          created_at: string
          id: string
          ignore_green: boolean
          ignore_red: boolean
          ignore_yellow: boolean
          interval_seconds: number
          max_percentage: number | null
          min_percentage: number | null
          monitoring_type: string
          threshold_attention: number | null
          threshold_critical: number | null
          threshold_excellent: number | null
          updated_at: string
        }
        Insert: {
          companies_per_page?: number
          created_at?: string
          id?: string
          ignore_green?: boolean
          ignore_red?: boolean
          ignore_yellow?: boolean
          interval_seconds?: number
          max_percentage?: number | null
          min_percentage?: number | null
          monitoring_type?: string
          threshold_attention?: number | null
          threshold_critical?: number | null
          threshold_excellent?: number | null
          updated_at?: string
        }
        Update: {
          companies_per_page?: number
          created_at?: string
          id?: string
          ignore_green?: boolean
          ignore_red?: boolean
          ignore_yellow?: boolean
          interval_seconds?: number
          max_percentage?: number | null
          min_percentage?: number | null
          monitoring_type?: string
          threshold_attention?: number | null
          threshold_critical?: number | null
          threshold_excellent?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          key: string
          name: string
          module: string
          description: string | null
        }
        Insert: {
          key: string
          name: string
          module: string
          description?: string | null
        }
        Update: {
          key?: string
          name?: string
          module?: string
          description?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          id: string
          role_id: number
          permission_key: string
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          role_id: number
          permission_key: string
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role_id?: number
          permission_key?: string
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          }
        ]
      }
      monitoring_alerts: {
        Row: {
          id: string
          tipo_monitoramento: string
          identificador_item: string
          alert_type: string
          severity: string
          percentual_atual: number
          contexto: Json | null
          detected_at: string
          tratado: boolean
          tratado_em: string | null
          tratado_por: number | null
          comentario_tratamento: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tipo_monitoramento: string
          identificador_item: string
          alert_type: string
          severity: string
          percentual_atual: number
          contexto?: Json | null
          detected_at?: string
          tratado?: boolean
          tratado_em?: string | null
          tratado_por?: number | null
          comentario_tratamento?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tipo_monitoramento?: string
          identificador_item?: string
          alert_type?: string
          severity?: string
          percentual_atual?: number
          contexto?: Json | null
          detected_at?: string
          tratado?: boolean
          tratado_em?: string | null
          tratado_por?: number | null
          comentario_tratamento?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_alerts_tratado_por_fkey"
            columns: ["tratado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      role_audit_log: {
        Row: {
          id: string
          role_id: number | null
          changed_by: number | null
          changed_at: string
          action: string
          old_values: Json | null
          new_values: Json | null
        }
        Insert: {
          id?: string
          role_id?: number | null
          changed_by?: number | null
          changed_at?: string
          action: string
          old_values?: Json | null
          new_values?: Json | null
        }
        Update: {
          id?: string
          role_id?: number | null
          changed_by?: number | null
          changed_at?: string
          action?: string
          old_values?: Json | null
          new_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "role_audit_log_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      roles: {
        Row: {
          description: string | null
          id: number
          name: string
          is_active: boolean
        }
        Insert: {
          description?: string | null
          id?: number
          name: string
          is_active?: boolean
        }
        Update: {
          description?: string | null
          id?: number
          name?: string
          is_active?: boolean
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: number
          ip_address: string | null
          revoked: boolean | null
          session_token: string
          user_agent: string | null
          user_id: number
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: number
          ip_address?: string | null
          revoked?: boolean | null
          session_token: string
          user_agent?: string | null
          user_id: number
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: number
          ip_address?: string | null
          revoked?: boolean | null
          session_token?: string
          user_agent?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_fila_rn: {
        Row: {
          created_at: string
          dentro: number
          fora: number
          id: number
          nome_fila: string
        }
        Insert: {
          created_at?: string
          dentro?: number
          fora?: number
          id?: number
          nome_fila: string
        }
        Update: {
          created_at?: string
          dentro?: number
          fora?: number
          id?: number
          nome_fila?: string
        }
        Relationships: []
      }
      sla_projetos_rn: {
        Row: {
          created_at: string
          dentro: number
          fora: number
          id: number
          nome_projeto: string
        }
        Insert: {
          created_at?: string
          dentro?: number
          fora?: number
          id?: number
          nome_projeto: string
        }
        Update: {
          created_at?: string
          dentro?: number
          fora?: number
          id?: number
          nome_projeto?: string
        }
        Relationships: []
      }
      smtp_settings: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          smtp_from_email: string
          smtp_from_name: string
          smtp_host: string
          smtp_password: string
          smtp_port: number
          smtp_secure: boolean
          smtp_user: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          smtp_from_email: string
          smtp_from_name: string
          smtp_host: string
          smtp_password: string
          smtp_port: number
          smtp_secure?: boolean
          smtp_user: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          smtp_from_email?: string
          smtp_from_name?: string
          smtp_host?: string
          smtp_password?: string
          smtp_port?: number
          smtp_secure?: boolean
          smtp_user?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          full_name: string
          id: number
          is_active: boolean | null
          password_hash: string
          role_id: number
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          full_name: string
          id?: number
          is_active?: boolean | null
          password_hash: string
          role_id: number
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          full_name?: string
          id?: number
          is_active?: boolean | null
          password_hash?: string
          role_id?: number
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
