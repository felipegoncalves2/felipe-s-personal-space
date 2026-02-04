import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      full_name,
      username,
      email,
      password,
      department,
      role_id,
      is_active
    } = await req.json();

    console.log("Creating user:", { username, email, role_id });

    // Validation
    if (!full_name || !username || !email || !password || !role_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Campos obrigatórios não preenchidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ success: false, error: 'Senha deve ter no mínimo 8 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if username already exists
    const { data: existingUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', username.toLowerCase())
      .single();

    if (existingUsername) {
      return new Response(
        JSON.stringify({ success: false, error: 'Este username já está em uso' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'Este email já está em uso' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash password using bcrypt.hashSync (sync version to avoid Worker issues in Deno)
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    console.log("Password hashed successfully");

    // Create user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        full_name: full_name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password_hash: passwordHash,
        department: department?.trim() || null,
        role_id: parseInt(role_id),
        is_active: is_active !== undefined ? is_active : true,
      })
      .select('id, full_name, username, email, department, is_active, created_at')
      .single();

    if (insertError) {
      console.error("Error creating user:", insertError);
      
      if (insertError.message?.includes('unique') || insertError.message?.includes('duplicate')) {
        return new Response(
          JSON.stringify({ success: false, error: 'Username ou email já está em uso' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao criar usuário: ' + insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("User created successfully:", newUser);

    return new Response(
      JSON.stringify({
        success: true,
        user: newUser,
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Create user error:", error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
