
-- Create index for performance on sla_projetos_rn
CREATE INDEX IF NOT EXISTS idx_sla_projetos_rn_created_at_desc ON sla_projetos_rn (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sla_fila_rn_created_at_desc ON sla_fila_rn (created_at DESC);

-- Function to get latest N records per item efficiently
CREATE OR REPLACE FUNCTION get_latest_sla_records(
  p_type TEXT,
  p_records_per_item INT DEFAULT 2
)
RETURNS TABLE (
  id INT,
  nome TEXT,
  dentro INT,
  fora INT,
  percentual NUMERIC,
  total INT,
  created_at TIMESTAMPTZ,
  row_num BIGINT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT sub.id, sub.nome, sub.dentro, sub.fora, sub.percentual, sub.total, sub.created_at, sub.rn
  FROM (
    SELECT 
      f.id,
      f.nome_fila AS nome,
      f.dentro,
      f.fora,
      f.percentual,
      f.total,
      f.created_at,
      ROW_NUMBER() OVER (PARTITION BY f.nome_fila ORDER BY f.created_at DESC) AS rn
    FROM sla_fila_rn f
    WHERE p_type = 'fila'
    UNION ALL
    SELECT 
      p.id,
      p.nome_projeto AS nome,
      p.dentro,
      p.fora,
      p.percentual,
      p.total,
      p.created_at,
      ROW_NUMBER() OVER (PARTITION BY p.nome_projeto ORDER BY p.created_at DESC) AS rn
    FROM sla_projetos_rn p
    WHERE p_type = 'projetos'
  ) sub
  WHERE sub.rn <= p_records_per_item
  ORDER BY sub.nome, sub.rn;
$$;
