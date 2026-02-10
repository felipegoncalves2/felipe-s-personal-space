
-- RPC to get history data aggregated by day or hour (latest per period)
CREATE OR REPLACE FUNCTION get_sla_history(
  p_type TEXT,
  p_identifier TEXT,
  p_granularity TEXT DEFAULT 'daily',
  p_days INT DEFAULT 15
)
RETURNS TABLE (
  period_key TEXT,
  display_date TEXT,
  dentro BIGINT,
  fora BIGINT,
  percentual NUMERIC,
  recorded_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
AS $$
  WITH source AS (
    SELECT 
      f.dentro,
      f.fora,
      f.created_at,
      CASE 
        WHEN p_granularity = 'daily' THEN to_char(f.created_at, 'YYYY-MM-DD')
        ELSE to_char(f.created_at, 'YYYY-MM-DD HH24')
      END AS pkey,
      CASE 
        WHEN p_granularity = 'daily' THEN to_char(f.created_at, 'DD/MM')
        ELSE to_char(f.created_at, 'DD/MM HH24') || 'h'
      END AS ddate,
      ROW_NUMBER() OVER (
        PARTITION BY 
          CASE 
            WHEN p_granularity = 'daily' THEN to_char(f.created_at, 'YYYY-MM-DD')
            ELSE to_char(f.created_at, 'YYYY-MM-DD HH24')
          END
        ORDER BY f.created_at DESC
      ) AS rn
    FROM sla_fila_rn f
    WHERE p_type = 'sla_fila'
      AND f.nome_fila = p_identifier
      AND f.created_at >= now() - (p_days || ' days')::interval
    
    UNION ALL
    
    SELECT 
      p.dentro,
      p.fora,
      p.created_at,
      CASE 
        WHEN p_granularity = 'daily' THEN to_char(p.created_at, 'YYYY-MM-DD')
        ELSE to_char(p.created_at, 'YYYY-MM-DD HH24')
      END AS pkey,
      CASE 
        WHEN p_granularity = 'daily' THEN to_char(p.created_at, 'DD/MM')
        ELSE to_char(p.created_at, 'DD/MM HH24') || 'h'
      END AS ddate,
      ROW_NUMBER() OVER (
        PARTITION BY 
          CASE 
            WHEN p_granularity = 'daily' THEN to_char(p.created_at, 'YYYY-MM-DD')
            ELSE to_char(p.created_at, 'YYYY-MM-DD HH24')
          END
        ORDER BY p.created_at DESC
      ) AS rn
    FROM sla_projetos_rn p
    WHERE p_type = 'sla_projetos'
      AND p.nome_projeto = p_identifier
      AND p.created_at >= now() - (p_days || ' days')::interval
  )
  SELECT 
    s.pkey,
    s.ddate,
    s.dentro,
    s.fora,
    CASE WHEN (s.dentro + s.fora) > 0 
      THEN ROUND((s.dentro::numeric / (s.dentro + s.fora)::numeric) * 100, 2)
      ELSE 100
    END,
    s.created_at
  FROM source s
  WHERE s.rn = 1
  ORDER BY s.pkey ASC;
$$;
