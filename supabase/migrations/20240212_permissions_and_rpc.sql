-- Insert Permissions
INSERT INTO permissions (key, name, description, module) VALUES
('VIEW_MPS', 'Visualizar MPS', 'Permite visualizar dados de MPS', 'MONITORAMENTO'),
('VIEW_SLA_FILA', 'Visualizar SLA Fila', 'Permite visualizar SLA por Fila', 'MONITORAMENTO'),
('VIEW_SLA_PROJETO', 'Visualizar SLA Projeto', 'Permite visualizar SLA por Projeto', 'MONITORAMENTO'),
('VIEW_SLA_ANALYSIS', 'Visualizar Análise de SLA', 'Permite visualizar análise de SLA', 'ANÁLISE SLA'),
('EXPORT_SLA_ANALYSIS', 'Exportar dados de SLA', 'Permite exportar dados de SLA', 'ANÁLISE SLA'),
('VIEW_REPORTS', 'Visualizar Relatórios', 'Permite visualizar relatórios', 'RELATÓRIOS'),
('EXPORT_REPORTS', 'Exportar Relatórios', 'Permite exportar relatórios', 'RELATÓRIOS'),
('CONFIG_ALERTS', 'Configurar Alertas', 'Permite configurar alertas', 'CONFIGURAÇÕES'),
('CONFIG_PRESENTATION', 'Configurar Apresentação', 'Permite configurar modo apresentação', 'CONFIGURAÇÕES'),
('CONFIG_SMTP', 'Configurar SMTP', 'Permite configurar SMTP', 'CONFIGURAÇÕES'),
('CONFIG_METAS', 'Configurar Metas', 'Permite configurar metas de SLA', 'CONFIGURAÇÕES'),
('CONFIG_ROLES', 'Gerenciar Perfis', 'Permite gerenciar perfis de acesso', 'CONFIGURAÇÕES')
ON CONFLICT (key) DO NOTHING;

-- Create RPC for Daily SLA Evolution
CREATE OR REPLACE FUNCTION get_sla_daily_evolution(p_month date DEFAULT date_trunc('month', now()))
RETURNS TABLE (
  dia date,
  dentro bigint,
  fora bigint,
  percentual numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH dias AS (
    SELECT generate_series(
      date_trunc('month', p_month),
      date_trunc('month', p_month) + interval '1 month' - interval '1 day',
      interval '1 day'
    )::date AS dia
  ),
  dados AS (
    SELECT
      date_trunc('day', data_criacao)::date AS dia,
      SUM(sla_detalhado_rn.dentro) AS dentro,
      SUM(sla_detalhado_rn.fora) AS fora
    FROM public.sla_detalhado_rn
    WHERE date_trunc('month', data_criacao) = date_trunc('month', p_month)
    GROUP BY 1
  )
  SELECT
    d.dia,
    COALESCE(dados.dentro, 0) AS dentro,
    COALESCE(dados.fora, 0) AS fora,
    CASE
      WHEN COALESCE(dados.dentro,0) + COALESCE(dados.fora,0) > 0
      THEN ROUND(
        (dados.dentro::numeric /
        (dados.dentro + dados.fora)) * 100
      ,2)
      ELSE NULL
    END AS percentual
  FROM dias d
  LEFT JOIN dados ON dados.dia = d.dia
  ORDER BY d.dia;
END;
$$ LANGUAGE plpgsql;
