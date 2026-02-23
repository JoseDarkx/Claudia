import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// FIX SEGURIDAD: Usar ANON_KEY en el frontend. La SERVICE_ROLE_KEY nunca debe exponerse en el navegador.
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ ALERTA: Faltan las variables de entorno (VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY) en el archivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});