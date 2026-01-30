-- Create function to update timestamps if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create presentation_settings table for storing presentation mode configuration
CREATE TABLE public.presentation_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  companies_per_page integer NOT NULL DEFAULT 4,
  interval_seconds integer NOT NULL DEFAULT 10,
  min_percentage numeric(5,2) DEFAULT NULL,
  max_percentage numeric(5,2) DEFAULT NULL,
  ignore_green boolean NOT NULL DEFAULT false,
  ignore_yellow boolean NOT NULL DEFAULT false,
  ignore_red boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default configuration
INSERT INTO public.presentation_settings (companies_per_page, interval_seconds) 
VALUES (4, 10);

-- Enable RLS
ALTER TABLE public.presentation_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for reading settings (anyone can read)
CREATE POLICY "Anyone can view presentation settings" 
ON public.presentation_settings 
FOR SELECT 
USING (true);

-- Create policy for updating settings
CREATE POLICY "Anyone can update presentation settings" 
ON public.presentation_settings 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_presentation_settings_updated_at
BEFORE UPDATE ON public.presentation_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();