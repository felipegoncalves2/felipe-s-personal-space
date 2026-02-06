import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface MonitoringData {
  empresa: string;
  total_base: number;
  total_sem_monitoramento: number;
  data_gravacao: string;
  monitoradas: number;
  percentual: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate session from header
    const authHeader = req.headers.get('authorization');
    const sessionToken = authHeader?.replace('Bearer ', '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (sessionToken) {
      // Validate session
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('revoked', false)
        .single();

      if (sessionError || !session) {
        return new Response(
          JSON.stringify({ error: 'Sessão inválida' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get latest monitoring data for each company
    const { data: rawData, error: dataError } = await supabase
      .from('monitoramento_parque')
      .select('empresa, total_base, total_sem_monitoramento, data_gravacao')
      .order('data_gravacao', { ascending: false });

    if (dataError) {
      console.error("Data fetch error:", dataError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar dados de monitoramento' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process data to get latest record per company
    const companiesMap = new Map<string, MonitoringData>();

    for (const row of rawData || []) {
      if (!companiesMap.has(row.empresa)) {
        const totalBase = parseInt(row.total_base) || 0;
        const semMonitoramento = parseInt(row.total_sem_monitoramento) || 0;
        const monitoradas = totalBase - semMonitoramento;
        const percentual = totalBase > 0 ? (monitoradas / totalBase) * 100 : 0;

        companiesMap.set(row.empresa, {
          empresa: row.empresa,
          total_base: totalBase,
          total_sem_monitoramento: semMonitoramento,
          data_gravacao: row.data_gravacao,
          monitoradas,
          percentual: Math.round(percentual * 100) / 100,
        });
      }
    }

    const data = Array.from(companiesMap.values());

    console.log(`Fetched monitoring data for ${data.length} companies`);

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Monitoring data error:", error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
