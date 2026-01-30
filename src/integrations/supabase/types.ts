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
          updated_at?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          description: string | null
          id: number
          name: string
        }
        Insert: {
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          description?: string | null
          id?: number
          name?: string
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
