
-- SGI CORPORATE - SCRIPT DE SEGURIDAD Y PERMISOS RLS

-- 1. Habilitar RLS en todas las tablas
ALTER TABLE public.procesos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registro_mensual_indicadores ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para la tabla PROCESOS
DROP POLICY IF EXISTS "Admins manage procesos" ON public.procesos;
CREATE POLICY "Admins manage procesos" ON public.procesos
FOR ALL TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'Administrador');

DROP POLICY IF EXISTS "Everyone reads procesos" ON public.procesos;
CREATE POLICY "Everyone reads procesos" ON public.procesos
FOR SELECT TO authenticated USING (true);

-- 3. Políticas para la tabla INDICADORES
DROP POLICY IF EXISTS "Admins manage indicadores" ON public.indicadores;
CREATE POLICY "Admins manage indicadores" ON public.indicadores
FOR ALL TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'Administrador');

DROP POLICY IF EXISTS "Everyone reads indicadores" ON public.indicadores;
CREATE POLICY "Everyone reads indicadores" ON public.indicadores
FOR SELECT TO authenticated USING (true);

-- 4. Políticas para la tabla REGISTRO MENSUAL
DROP POLICY IF EXISTS "Admins manage all registrations" ON public.registro_mensual_indicadores;
CREATE POLICY "Admins manage all registrations" ON public.registro_mensual_indicadores
FOR ALL TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'Administrador');

DROP POLICY IF EXISTS "Líderes manage own process registrations" ON public.registro_mensual_indicadores;
CREATE POLICY "Líderes manage own process registrations" ON public.registro_mensual_indicadores
FOR ALL TO authenticated
USING (proceso_id = (SELECT proceso_id FROM profiles WHERE id = auth.uid()));

-- 5. Función auxiliar para resetear contraseñas desde el panel (Requiere ser ejecutada por superuser)
-- Esta función permite que un Admin de la app cambie claves de Auth
CREATE OR REPLACE FUNCTION admin_reset_password(target_user_id UUID, new_password TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE auth.users SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
