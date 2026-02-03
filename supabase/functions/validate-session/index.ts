import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface UserRow {
  id: number;
  full_name: string;
  username: string;
  email: string;
  department: string | null;
  is_active: boolean;
  role_id: number;
  roles: {
    name: string;
    description: string | null;
    is_active: boolean;
  } | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { session_token } = await req.json();

    if (!session_token) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Token de sessão obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('session_token', session_token)
      .eq('revoked', false)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Sessão não encontrada' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    if (new Date(session.expires_at) < new Date()) {
      // Revoke expired session
      await supabase
        .from('sessions')
        .update({ revoked: true })
        .eq('id', session.id);

      return new Response(
        JSON.stringify({ valid: false, error: 'Sessão expirada' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        username,
        email,
        department,
        is_active,
        role_id,
        roles(name, description, is_active)
      `)
      .eq('id', session.user_id)
      .eq('is_active', true)
      .single() as { data: UserRow | null; error: unknown };

    if (userError || !user) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Usuário não encontrado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!user.roles?.is_active) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Perfil inativo' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get permissions for the role
    const { data: permissionsData, error: permissionsError } = await supabase
      .from('role_permissions')
      .select('permission_key')
      .eq('role_id', user.role_id)
      .eq('enabled', true);

    const permissions = permissionsData?.map(p => p.permission_key) || [];

    const userData = {
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      department: user.department,
      role: user.roles?.name || 'USUARIO',
      role_description: user.roles?.description,
      permissions: permissions,
    };

    return new Response(
      JSON.stringify({
        valid: true,
        user: userData,
        expires_at: session.expires_at,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Validate session error:", error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
