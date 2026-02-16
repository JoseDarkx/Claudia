import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Cambiamos la ANON_KEY por la SERVICE_ROLE_KEY para habilitar funciones de Admin
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('⚠️ ALERTA: Faltan las llaves (URL o SERVICE_ROLE) en el archivo .env');
}

// Al usar la Service Role Key, Supabase te permite usar auth.admin
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});