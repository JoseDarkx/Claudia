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

    const body = await req.json();
    const { email, password, full_name, role, proceso_id, nombre_proceso } = body;

    console.log(`CREAR-USUARIO: Iniciando proceso para ${email}`);

    if (!email || !full_name) throw new Error("Email y Nombre son obligatorios");

    // 1. Invitar usuario por Email (esto dispara la plantilla de "Invite User")
    console.log("Enviando invitación por email...");
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name, role, nombre_proceso }
    });

    if (authError) {
      console.error(`Error Auth (Invitation): ${authError.message}`);
      throw new Error(`Error al enviar invitación: ${authError.message}. Verifica los límites de correo o la configuración SMTP.`);
    }
    
    const userId = authData.user.id;
    console.log(`Usuario invitado exitosamente. ID: ${userId}`);

    // 2. Definir la contraseña y marcar como verificado (para que entre directo)
    console.log("Asignando contraseña inicial y confirmando email...");
    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: password || '123456',
      email_confirm: true,
      user_metadata: { full_name, role, nombre_proceso } // Sincronizamos metadata también aquí
    });

    if (updateAuthError) {
      console.warn("Aviso: No se pudo auto-confirmar el usuario:", updateAuthError.message);
    }

    // 3. Insertar/Actualizar perfil en la tabla 'profiles'
    console.log("Actualizando tabla de perfiles...");
    const { error: profileInsertError } = await supabaseAdmin.from('profiles').upsert([
      {
        id: userId,
        email,
        full_name,
        role,
        proceso_id: (proceso_id && proceso_id !== "") ? proceso_id : null
      }
    ]);

    if (profileInsertError) {
      console.error("Error al insertar perfil:", profileInsertError.message);
      throw new Error(`Error DB (Profile): ${profileInsertError.message}`);
    }

    console.log("Usuario creado y perfil sincronizado correctamente.");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Usuario creado correctamente",
      userId: userId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error en crear-usuario:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})