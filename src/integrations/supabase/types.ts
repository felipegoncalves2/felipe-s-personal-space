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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      backlog_analytics: {
        Row: {
          codigo_projeto: string
          data_ref: string
          empresa: string
          faixa_dias: string
          fila: string
          total: number | null
        }
        Insert: {
          codigo_projeto: string
          data_ref: string
          empresa: string
          faixa_dias: string
          fila: string
          total?: number | null
        }
        Update: {
          codigo_projeto?: string
          data_ref?: string
          empresa?: string
          faixa_dias?: string
          fila?: string
          total?: number | null
        }
        Relationships: []
      }
      backlog_monitoramento: {
        Row: {
          cidade: string | null
          codigo_projeto: string | null
          conta_atribuida: string | null
          created_at: string | null
          data_criacao: string | null
          dias_em_aberto: number | null
          empresa: string | null
          empresa_nome: string | null
          estado: string | null
          fila: string | null
          id: number
          mes_abertura: string | null
          nome_fantasia: string | null
          nome_projeto: string | null
          numero_referencia: string
          numero_serie: string | null
          produto_descricao: string | null
          servico: string | null
          situacao_equipamento: string | null
          solucao_hardware: string | null
          solucao_servico_software: string | null
          status: string | null
          status_cliente: string | null
          tempo_atendimento_formatado: string | null
          tempo_atendimento_horas: number | null
          tempo_atendimento_segundos: number | null
          tipo_incidente: string | null
          tipo_problema_hardware: string | null
          tipo_problema_servico: string | null
          troca_tecnica: string | null
        }
        Insert: {
          cidade?: string | null
          codigo_projeto?: string | null
          conta_atribuida?: string | null
          created_at?: string | null
          data_criacao?: string | null
          dias_em_aberto?: number | null
          empresa?: string | null
          empresa_nome?: string | null
          estado?: string | null
          fila?: string | null
          id?: number
          mes_abertura?: string | null
          nome_fantasia?: string | null
          nome_projeto?: string | null
          numero_referencia: string
          numero_serie?: string | null
          produto_descricao?: string | null
          servico?: string | null
          situacao_equipamento?: string | null
          solucao_hardware?: string | null
          solucao_servico_software?: string | null
          status?: string | null
          status_cliente?: string | null
          tempo_atendimento_formatado?: string | null
          tempo_atendimento_horas?: number | null
          tempo_atendimento_segundos?: number | null
          tipo_incidente?: string | null
          tipo_problema_hardware?: string | null
          tipo_problema_servico?: string | null
          troca_tecnica?: string | null
        }
        Update: {
          cidade?: string | null
          codigo_projeto?: string | null
          conta_atribuida?: string | null
          created_at?: string | null
          data_criacao?: string | null
          dias_em_aberto?: number | null
          empresa?: string | null
          empresa_nome?: string | null
          estado?: string | null
          fila?: string | null
          id?: number
          mes_abertura?: string | null
          nome_fantasia?: string | null
          nome_projeto?: string | null
          numero_referencia?: string
          numero_serie?: string | null
          produto_descricao?: string | null
          servico?: string | null
          situacao_equipamento?: string | null
          solucao_hardware?: string | null
          solucao_servico_software?: string | null
          status?: string | null
          status_cliente?: string | null
          tempo_atendimento_formatado?: string | null
          tempo_atendimento_horas?: number | null
          tempo_atendimento_segundos?: number | null
          tipo_incidente?: string | null
          tipo_problema_hardware?: string | null
          tipo_problema_servico?: string | null
          troca_tecnica?: string | null
        }
        Relationships: []
      }
      backlog_snapshot: {
        Row: {
          codigo_projeto: string | null
          created_at: string | null
          data_snapshot: string
          dias_em_aberto: number | null
          empresa: string | null
          fila: string | null
          id: number
          numero_referencia: string
          periodo: string | null
          situacao_equipamento: string | null
          status: string | null
          status_cliente: string | null
        }
        Insert: {
          codigo_projeto?: string | null
          created_at?: string | null
          data_snapshot: string
          dias_em_aberto?: number | null
          empresa?: string | null
          fila?: string | null
          id?: number
          numero_referencia: string
          periodo?: string | null
          situacao_equipamento?: string | null
          status?: string | null
          status_cliente?: string | null
        }
        Update: {
          codigo_projeto?: string | null
          created_at?: string | null
          data_snapshot?: string
          dias_em_aberto?: number | null
          empresa?: string | null
          fila?: string | null
          id?: number
          numero_referencia?: string
          periodo?: string | null
          situacao_equipamento?: string | null
          status?: string | null
          status_cliente?: string | null
        }
        Relationships: []
      }
      backlog_total_diario: {
        Row: {
          acima_30: number | null
          acima_50: number | null
          created_at: string | null
          data_ref: string
          idade_media: number | null
          total_backlog: number
        }
        Insert: {
          acima_30?: number | null
          acima_50?: number | null
          created_at?: string | null
          data_ref: string
          idade_media?: number | null
          total_backlog: number
        }
        Update: {
          acima_30?: number | null
          acima_50?: number | null
          created_at?: string | null
          data_ref?: string
          idade_media?: number | null
          total_backlog?: number
        }
        Relationships: []
      }
      monitoramento_parque: {
        Row: {
          data_gravacao: string
          empresa: string
          id: number
          total_base: number
          total_sem_monitoramento: number
        }
        Insert: {
          data_gravacao?: string
          empresa: string
          id: number
          total_base: number
          total_sem_monitoramento: number
        }
        Update: {
          data_gravacao?: string
          empresa?: string
          id?: number
          total_base?: number
          total_sem_monitoramento?: number
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
          created_at: string | null
          id: string
          tipo_monitoramento: string
          trend_consecutive_periods: number
          trend_enabled: boolean
          updated_at: string
        }
        Insert: {
          anomaly_enabled: boolean
          anomaly_moving_avg_days: number
          anomaly_stddev_multiplier: number
          auto_resolve_consecutive_readings: number
          auto_resolve_enabled: boolean
          created_at?: string | null
          id?: string
          tipo_monitoramento: string
          trend_consecutive_periods: number
          trend_enabled: boolean
          updated_at: string
        }
        Update: {
          anomaly_enabled?: boolean
          anomaly_moving_avg_days?: number
          anomaly_stddev_multiplier?: number
          auto_resolve_consecutive_readings?: number
          auto_resolve_enabled?: boolean
          created_at?: string | null
          id?: string
          tipo_monitoramento?: string
          trend_consecutive_periods?: number
          trend_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      monitoring_alerts: {
        Row: {
          alert_type: string
          comentario_tratamento: string | null
          contexto: Json | null
          created_at: string | null
          detected_at: string
          id: string
          identificador_item: string
          percentual_atual: number
          severity: string
          tipo_monitoramento: string
          tratado: boolean
          tratado_em: string | null
          tratado_por: number | null
        }
        Insert: {
          alert_type: string
          comentario_tratamento?: string | null
          contexto?: Json | null
          created_at?: string | null
          detected_at: string
          id?: string
          identificador_item: string
          percentual_atual: number
          severity: string
          tipo_monitoramento: string
          tratado: boolean
          tratado_em?: string | null
          tratado_por?: number | null
        }
        Update: {
          alert_type?: string
          comentario_tratamento?: string | null
          contexto?: Json | null
          created_at?: string | null
          detected_at?: string
          id?: string
          identificador_item?: string
          percentual_atual?: number
          severity?: string
          tipo_monitoramento?: string
          tratado?: boolean
          tratado_em?: string | null
          tratado_por?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_alerts_tratado_por_fkey"
            columns: ["tratado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          description: string | null
          key: string
          module: string
          name: string
        }
        Insert: {
          description?: string | null
          key: string
          module: string
          name: string
        }
        Update: {
          description?: string | null
          key?: string
          module?: string
          name?: string
        }
        Relationships: []
      }
      presentation_settings: {
        Row: {
          companies_per_page: number
          created_at: string | null
          id: string
          ignore_green: boolean
          ignore_red: boolean
          ignore_yellow: boolean
          interval_seconds: number
          max_percentage: number | null
          min_percentage: number | null
          monitoring_type: string
          theme_danger: string | null
          theme_success: string | null
          theme_warning: string | null
          threshold_atencao: number | null
          threshold_attention: number | null
          threshold_critical: number | null
          threshold_excelente: number | null
          threshold_excellent: number | null
          updated_at: string
        }
        Insert: {
          companies_per_page: number
          created_at?: string | null
          id?: string
          ignore_green: boolean
          ignore_red: boolean
          ignore_yellow: boolean
          interval_seconds: number
          max_percentage?: number | null
          min_percentage?: number | null
          monitoring_type?: string
          theme_danger?: string | null
          theme_success?: string | null
          theme_warning?: string | null
          threshold_atencao?: number | null
          threshold_attention?: number | null
          threshold_critical?: number | null
          threshold_excelente?: number | null
          threshold_excellent?: number | null
          updated_at?: string
        }
        Update: {
          companies_per_page?: number
          created_at?: string | null
          id?: string
          ignore_green?: boolean
          ignore_red?: boolean
          ignore_yellow?: boolean
          interval_seconds?: number
          max_percentage?: number | null
          min_percentage?: number | null
          monitoring_type?: string
          theme_danger?: string | null
          theme_success?: string | null
          theme_warning?: string | null
          threshold_atencao?: number | null
          threshold_attention?: number | null
          threshold_critical?: number | null
          threshold_excelente?: number | null
          threshold_excellent?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      resumo_backlog_dia: {
        Row: {
          created_at: string | null
          data: string
          total_abertos: number
          total_atrasados: number
          total_criticos: number
        }
        Insert: {
          created_at?: string | null
          data: string
          total_abertos?: number
          total_atrasados?: number
          total_criticos?: number
        }
        Update: {
          created_at?: string | null
          data?: string
          total_abertos?: number
          total_atrasados?: number
          total_criticos?: number
        }
        Relationships: []
      }
      resumo_mps_dia: {
        Row: {
          created_at: string | null
          data: string
          empresa: string
          percentual: number
          total_base: number
          total_sem_comunicacao: number
        }
        Insert: {
          created_at?: string | null
          data: string
          empresa: string
          percentual?: number
          total_base?: number
          total_sem_comunicacao?: number
        }
        Update: {
          created_at?: string | null
          data?: string
          empresa?: string
          percentual?: number
          total_base?: number
          total_sem_comunicacao?: number
        }
        Relationships: []
      }
      resumo_sla_fila_dia: {
        Row: {
          created_at: string | null
          data: string
          dentro: number
          fila: string
          fora: number
          percentual: number
          total: number
        }
        Insert: {
          created_at?: string | null
          data: string
          dentro?: number
          fila: string
          fora?: number
          percentual?: number
          total?: number
        }
        Update: {
          created_at?: string | null
          data?: string
          dentro?: number
          fila?: string
          fora?: number
          percentual?: number
          total?: number
        }
        Relationships: []
      }
      resumo_sla_projeto_dia: {
        Row: {
          created_at: string | null
          data: string
          dentro: number
          fora: number
          nome_projeto: string
          percentual: number
          total: number
        }
        Insert: {
          created_at?: string | null
          data: string
          dentro?: number
          fora?: number
          nome_projeto: string
          percentual?: number
          total?: number
        }
        Update: {
          created_at?: string | null
          data?: string
          dentro?: number
          fora?: number
          nome_projeto?: string
          percentual?: number
          total?: number
        }
        Relationships: []
      }
      role_audit_log: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: number | null
          id: string
          new_values: Json | null
          old_values: Json | null
          role_id: number | null
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: number | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          role_id?: number | null
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: number | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          role_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "role_audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_audit_log_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          permission_key: string | null
          role_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          permission_key?: string | null
          role_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          permission_key?: string | null
          role_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          description: string | null
          id: number
          is_active: boolean | null
          name: string
        }
        Insert: {
          description?: string | null
          id?: number
          is_active?: boolean | null
          name: string
        }
        Update: {
          description?: string | null
          id?: number
          is_active?: boolean | null
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
      sla_detalhado_rn: {
        Row: {
          categoria_perda_sla: string | null
          cidade: string | null
          conta_atribuida: string | null
          created_at: string | null
          data_criacao: string | null
          data_fechamento: string | null
          dentro: number
          dentro_fora: string
          dia: number | null
          divisao_perda_sla: string | null
          empresa: string | null
          fila: string | null
          fora: number
          id: string
          mes: string | null
          motivo_perda_sla: string | null
          nome_projeto: string | null
          numero_referencia: string | null
          numero_serie: string | null
          observacao_perda_sla: string | null
          produto_descricao: string | null
          qtde_pausa: number
          sla_contratual: string | null
          sla_perdido: string | null
          sla_solucao: number | null
          solucao_hardware: string | null
          status: string | null
          tipo_incidente: string | null
          tipo_problema_hardware: string | null
          tipo_sla: string | null
          uf: string | null
        }
        Insert: {
          categoria_perda_sla?: string | null
          cidade?: string | null
          conta_atribuida?: string | null
          created_at?: string | null
          data_criacao?: string | null
          data_fechamento?: string | null
          dentro: number
          dentro_fora: string
          dia?: number | null
          divisao_perda_sla?: string | null
          empresa?: string | null
          fila?: string | null
          fora: number
          id?: string
          mes?: string | null
          motivo_perda_sla?: string | null
          nome_projeto?: string | null
          numero_referencia?: string | null
          numero_serie?: string | null
          observacao_perda_sla?: string | null
          produto_descricao?: string | null
          qtde_pausa: number
          sla_contratual?: string | null
          sla_perdido?: string | null
          sla_solucao?: number | null
          solucao_hardware?: string | null
          status?: string | null
          tipo_incidente?: string | null
          tipo_problema_hardware?: string | null
          tipo_sla?: string | null
          uf?: string | null
        }
        Update: {
          categoria_perda_sla?: string | null
          cidade?: string | null
          conta_atribuida?: string | null
          created_at?: string | null
          data_criacao?: string | null
          data_fechamento?: string | null
          dentro?: number
          dentro_fora?: string
          dia?: number | null
          divisao_perda_sla?: string | null
          empresa?: string | null
          fila?: string | null
          fora?: number
          id?: string
          mes?: string | null
          motivo_perda_sla?: string | null
          nome_projeto?: string | null
          numero_referencia?: string | null
          numero_serie?: string | null
          observacao_perda_sla?: string | null
          produto_descricao?: string | null
          qtde_pausa?: number
          sla_contratual?: string | null
          sla_perdido?: string | null
          sla_solucao?: number | null
          solucao_hardware?: string | null
          status?: string | null
          tipo_incidente?: string | null
          tipo_problema_hardware?: string | null
          tipo_sla?: string | null
          uf?: string | null
        }
        Relationships: []
      }
      sla_fila_rn: {
        Row: {
          created_at: string | null
          dentro: number
          fora: number
          id: number
          nome_fila: string
          percentual: number
          total: number
        }
        Insert: {
          created_at?: string | null
          dentro: number
          fora: number
          id?: number
          nome_fila: string
          percentual: number
          total: number
        }
        Update: {
          created_at?: string | null
          dentro?: number
          fora?: number
          id?: number
          nome_fila?: string
          percentual?: number
          total?: number
        }
        Relationships: []
      }
      sla_metas: {
        Row: {
          ativo: boolean
          created_at: string | null
          id: string
          identificador: string
          meta_atencao: number | null
          meta_excelente: number | null
          tipo: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          ativo: boolean
          created_at?: string | null
          id?: string
          identificador: string
          meta_atencao?: number | null
          meta_excelente?: number | null
          tipo: string
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string | null
          id?: string
          identificador?: string
          meta_atencao?: number | null
          meta_excelente?: number | null
          tipo?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: []
      }
      sla_metas_log: {
        Row: {
          alterado_em: string
          alterado_por: string | null
          id: string
          identificador: string
          meta_atencao_new: number | null
          meta_atencao_old: number | null
          meta_excelente_new: number | null
          meta_excelente_old: number | null
          meta_id: string
          tipo: string
        }
        Insert: {
          alterado_em: string
          alterado_por?: string | null
          id?: string
          identificador: string
          meta_atencao_new?: number | null
          meta_atencao_old?: number | null
          meta_excelente_new?: number | null
          meta_excelente_old?: number | null
          meta_id: string
          tipo: string
        }
        Update: {
          alterado_em?: string
          alterado_por?: string | null
          id?: string
          identificador?: string
          meta_atencao_new?: number | null
          meta_atencao_old?: number | null
          meta_excelente_new?: number | null
          meta_excelente_old?: number | null
          meta_id?: string
          tipo?: string
        }
        Relationships: []
      }
      sla_projetos_rn: {
        Row: {
          created_at: string | null
          created_at_hour: string | null
          dentro: number
          fora: number
          id: number
          nome_projeto: string
          percentual: number
          total: number
        }
        Insert: {
          created_at?: string | null
          created_at_hour?: string | null
          dentro: number
          fora: number
          id?: number
          nome_projeto: string
          percentual: number
          total: number
        }
        Update: {
          created_at?: string | null
          created_at_hour?: string | null
          dentro?: number
          fora?: number
          id?: number
          nome_projeto?: string
          percentual?: number
          total?: number
        }
        Relationships: []
      }
      sla_resumo_mensal: {
        Row: {
          causes_json: Json
          history_json: Json
          id: string
          kpis_json: Json
          mes_ref: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          causes_json: Json
          history_json: Json
          id?: string
          kpis_json: Json
          mes_ref: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          causes_json?: Json
          history_json?: Json
          id?: string
          kpis_json?: Json
          mes_ref?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      smtp_settings: {
        Row: {
          created_at: string | null
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
          created_at?: string | null
          enabled: boolean
          id?: string
          smtp_from_email: string
          smtp_from_name: string
          smtp_host: string
          smtp_password: string
          smtp_port: number
          smtp_secure: boolean
          smtp_user: string
          updated_at: string
        }
        Update: {
          created_at?: string | null
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
      calculate_monthly_sla_json: {
        Args: { p_end_date: string; p_start_date: string; p_tipo: string }
        Returns: Json
      }
      consolidate_daily_summaries: {
        Args: { target_date?: string }
        Returns: undefined
      }
      get_backlog_summary: { Args: never; Returns: Json }
      get_latest_sla_records: {
        Args: { p_records_per_item?: number; p_type: string }
        Returns: {
          created_at: string
          dentro: number
          fora: number
          id: number
          nome: string
          percentual: number
          row_num: number
          total: number
        }[]
      }
      get_monthly_sla_kpis:
        | {
            Args: { p_end_date: string; p_start_date: string; p_tipo: string }
            Returns: Json
          }
        | {
            Args: { p_end_date: string; p_start_date: string; p_tipo: string }
            Returns: Json
          }
      get_sla_daily_evolution: {
        Args: { p_month?: string }
        Returns: {
          dentro: number
          dia: string
          fora: number
          percentual: number
        }[]
      }
      get_sla_history: {
        Args: {
          p_days?: number
          p_granularity?: string
          p_identifier: string
          p_type: string
        }
        Returns: {
          dentro: number
          display_date: string
          fora: number
          percentual: number
          period_key: string
          recorded_at: string
        }[]
      }
      processar_backlog_diario: { Args: never; Returns: undefined }
      rpc_login: {
        Args: { p_login: string; p_password: string }
        Returns: Json
      }
      rpc_logout: { Args: { p_token: string }; Returns: Json }
      rpc_validate_session: { Args: { p_token: string }; Returns: Json }
      truncate_backlog_monitoramento: { Args: never; Returns: undefined }
      truncate_monitoramento_parque: { Args: never; Returns: undefined }
      truncate_sla_detalhado_rn: { Args: never; Returns: undefined }
      update_monthly_sla_summaries: {
        Args: { p_month: string }
        Returns: undefined
      }
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
