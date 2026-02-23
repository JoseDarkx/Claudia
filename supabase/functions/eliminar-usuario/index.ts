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

    // --- SEGURIDAD MANUAL ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("No se proporcionó token de autorización");

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Token inválido o sesión expirada");

    const { data: profile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileCheckError || profile?.role !== 'Administrador') {
      throw new Error("Acceso denegado: Se requiere rol de Administrador");
    }
    // -------------------------

    const { userId } = await req.json();
    if (!userId) throw new Error('userId es requerido');

    console.log(`ELIMINAR-USUARIO: Procesando ${userId} solicitado por ${user.email}`);

    // 1. Limpiar referencias en registro_mensual_indicadores (Foreign Key constraint)
    console.log("Limpiando registros mensuales...");
    const { error: clearRegsError } = await supabaseAdmin
      .from('registro_mensual_indicadores')
      .update({ usuario_sistema: null })
      .eq('usuario_sistema', userId);

    if (clearRegsError) {
      console.warn("Aviso: No se pudieron limpiar registros mensuales (tal vez no existan registros o la columna):", clearRegsError.message);
    }

    // 2. Limpiar referencias en procesos (Lider del proceso)
    console.log("Limpiando liderazgo de procesos...");
    const { error: clearLiderError } = await supabaseAdmin
      .from('procesos')
      .update({ lider_id: null })
      .eq('lider_id', userId);

    if (clearLiderError) {
      console.warn("Aviso: No se pudo limpiar lider_id en procesos:", clearLiderError.message);
    }

    // 3. Eliminar el perfil
    console.log("Eliminando perfil...");
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error("Error al eliminar perfil:", profileError.message);
      throw new Error(`Database error deleting profile: ${profileError.message}`);
    }

    // 4. Eliminar el usuario de auth
    console.log("Eliminando usuario de Auth...");
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      console.error("Error al eliminar usuario de Auth:", authError.message);
      throw new Error(`Auth error deleting user: ${authError.message}`);
    }

    return new Response(JSON.stringify({ success: true, message: "Usuario eliminado correctamente" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error en eliminar-usuario:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})
