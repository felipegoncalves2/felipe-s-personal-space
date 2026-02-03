import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Password verification - supports both bcrypt hashes and plain text
async function verifyPassword(password: string, storedPassword: string): Promise<boolean> {
  try {
    // Check if stored password is a bcrypt hash (starts with $2a$, $2b$, or $2y$)
    if (storedPassword.startsWith('$2')) {
      return bcrypt.compareSync(password, storedPassword);
    }
    // Fallback: plain text comparison (for legacy/dev purposes)
    return password === storedPassword;
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

interface UserRow {
  id: number;
  full_name: string;
  username: string;
  email: string;
  password_hash: string;
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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { login, password } = await req.json();

    if (!login || !password) {
      return new Response(
        JSON.stringify({ error: 'Login e senha são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find user by email or username
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        username,
        email,
        password_hash,
        department,
        is_active,
        role_id,
        roles(name, description, is_active)
      `)
      .or(`email.eq.${login},username.eq.${login}`)
      .eq('is_active', true)
      .single() as { data: UserRow | null; error: unknown };

    if (userError || !user) {
      console.log("User not found:", userError);
      return new Response(
        JSON.stringify({ error: 'Credenciais inválidas' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!user.roles?.is_active) {
      console.log("Role is inactive for user:", user.username);
      return new Response(
        JSON.stringify({ error: 'Esta conta está associada a um perfil inativo' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      console.log("Invalid password for user:", user.username);
      return new Response(
        JSON.stringify({ error: 'Credenciais inválidas' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate session token
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

    // Get client info
    const ipAddress = req.headers.get('x-forwarded-for') ||
      req.headers.get('cf-connecting-ip') ||
      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Create session
    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: expiresAt.toISOString(),
      });

    if (sessionError) {
      console.error("Session creation error:", sessionError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar sessão' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get permissions for the role
    const { data: permissionsData, error: permissionsError } = await supabase
      .from('role_permissions')
      .select('permission_key')
      .eq('role_id', user.role_id)
      .eq('enabled', true);

    if (permissionsError) {
      console.error("Error fetching permissions:", permissionsError);
    }

    const permissions = permissionsData?.map(p => p.permission_key) || [];

    // Return user data with session
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

    console.log("Login successful for:", user.username);

    return new Response(
      JSON.stringify({
        success: true,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        user: userData,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Login error:", error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
