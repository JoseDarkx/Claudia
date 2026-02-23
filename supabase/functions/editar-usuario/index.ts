import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAdminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseAdminKey) {
      throw new Error("Faltan variables de configuración en el servidor");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // --- SEGURIDAD MANUAL ELIMINANDO BLOQUEO JWT DEL GATEWAY ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("No se proporcionó token de autorización");

    // Verificar el usuario que hace la petición
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Token inválido o sesión expirada");

    // Verificar que el usuario sea Administrador
    const { data: profile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileCheckError || profile?.role !== 'Administrador') {
      throw new Error("Acceso denegado: Se requiere rol de Administrador");
    }
    // ------------------------------------------------------------

    const { userId, full_name, role, proceso_id, password } = await req.json();

    if (!userId) throw new Error('userId es requerido');

    console.log(`EDITAR-USUARIO: Procesando ${userId} solicitado por ${user.email}`);

    // 1. Actualizar el perfil en la tabla profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name,
        role,
        proceso_id: proceso_id || null
      })
      .eq('id', userId);

    if (profileError) throw profileError;

    // 2. Si viene una nueva contraseña, actualizarla en auth
    if (password && password.trim() !== '') {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: password
      });
      if (authError) throw authError;
    }

    return new Response(JSON.stringify({ success: true, message: "Usuario actualizado correctamente" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error en editar-usuario:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})
