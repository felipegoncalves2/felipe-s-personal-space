-- Add monitoring_type column to presentation_settings
ALTER TABLE public.presentation_settings 
ADD COLUMN monitoring_type text NOT NULL DEFAULT 'mps';

-- Create unique constraint for monitoring_type
ALTER TABLE public.presentation_settings 
ADD CONSTRAINT presentation_settings_monitoring_type_unique UNIQUE (monitoring_type);

-- Update existing row to be for 'mps'
UPDATE public.presentation_settings SET monitoring_type = 'mps' WHERE monitoring_type = 'mps';

-- Insert default settings for sla_fila and sla_projetos
INSERT INTO public.presentation_settings (monitoring_type, companies_per_page, interval_seconds, min_percentage, max_percentage, ignore_green, ignore_yellow, ignore_red)
VALUES 
  ('sla_fila', 4, 10, NULL, NULL, false, false, false),
  ('sla_projetos', 4, 10, NULL, NULL, false, false, false)
ON CONFLICT (monitoring_type) DO NOTHING;