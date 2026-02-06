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
  created_at: string;
  roles: { name: string; description: string | null } | null;
}

interface CheckUserRow {
  id: number;
  roles: { name: string } | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('per_page') || '10');
    const search = url.searchParams.get('search') || '';

    // Validate session
    const authHeader = req.headers.get('authorization');
    const sessionToken = authHeader?.replace('Bearer ', '');

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Token de sessão obrigatório' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate session and check if admin
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

    // Get user with role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, roles(name)')
      .eq('id', session.user_id)
      .single() as { data: CheckUserRow | null; error: unknown };

    if (userError || !user || user.roles?.name !== 'ADM') {
      return new Response(
        JSON.stringify({ error: 'Acesso não autorizado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query for count
    let countQuery = supabase
      .from('users')
      .select('id', { count: 'exact', head: true });

    if (search) {
      countQuery = countQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,department.ilike.%${search}%`);
    }

    const { count } = await countQuery;

    // Apply pagination
    const offset = (page - 1) * perPage;
    let usersQuery = supabase
      .from('users')
      .select(`
        id,
        full_name,
        username,
        email,
        department,
        is_active,
        created_at,
        roles(name, description)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1);

    if (search) {
      usersQuery = usersQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,department.ilike.%${search}%`);
    }

    const { data: users, error: usersError } = await usersQuery as { data: UserRow[] | null; error: unknown };

    if (usersError) {
      console.error("Users fetch error:", usersError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar usuários' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formattedUsers = (users || []).map(u => ({
      id: u.id,
      full_name: u.full_name,
      username: u.username,
      email: u.email,
      department: u.department,
      is_active: u.is_active,
      created_at: u.created_at,
      role: u.roles?.name,
      role_description: u.roles?.description,
    }));

    const totalPages = Math.ceil((count || 0) / perPage);

    return new Response(
      JSON.stringify({
        success: true,
        data: formattedUsers,
        pagination: {
          page,
          per_page: perPage,
          total: count || 0,
          total_pages: totalPages,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Get users error:", error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
