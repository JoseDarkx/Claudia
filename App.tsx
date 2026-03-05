import React, { useEffect, useState, createContext, useContext, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation, Outlet } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { UserProfile } from './types';
import { LayoutGrid, ClipboardList, Building2, History, Settings, LogOut, FilePlus2 } from 'lucide-react';
import Swal from 'sweetalert2';

// --- IMPORTACIONES LAZY (CARGA PEREZOSA) ---
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MatrizIndicadores = lazy(() => import('./pages/MatrizIndicadores'));
const RegistroIndicadores = lazy(() => import('./pages/RegistroIndicadores'));
const Historico = lazy(() => import('./pages/Historico'));
const ProcesosView = lazy(() => import('./pages/ProcesosView'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => { }
});

export const useAuth = () => useContext(AuthContext);

// Componente de Carga
const LoadingScreen = () => (
  <div className="h-full w-full min-h-[500px] flex flex-col items-center justify-center text-slate-400 gap-4">
    <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
    <span className="text-xs font-bold uppercase tracking-widest">Cargando...</span>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // --- VERSIONADO AUTOMÁTICO (Limpia caché al actualizar la app) ---
  // ⚠️ Incrementa este número cada vez que despliegues una actualización importante.
  const APP_VERSION = "1.0.0";
  useEffect(() => {
    const storedVersion = localStorage.getItem("app_version");
    if (storedVersion !== APP_VERSION) {
      console.log(`🔄 Versión cambiada (${storedVersion} → ${APP_VERSION}). Limpiando caché automáticamente.`);
      localStorage.clear();
      localStorage.setItem("app_version", APP_VERSION);
    }
  }, []);

  // --- FUNCIÓN DE SALIDA LIMPIA ---
  const handleSignOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error al salir:", error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // --- TEMPORIZADOR DE SEGURIDAD (ANTIBLOQUEO) ---
    // Aumentado a 20s para soportar conexiones muy lentas o arranques en frío de la DB.
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('⚠️ No se recibió respuesta de Supabase a tiempo. Forzando fin de carga.');
        setLoading(false);
      }
    }, 20000);

    const sessionCheck = async () => {
      console.log("🔍 Iniciando verificación de sesión...");
      try {
        // Envolviendo getSession en una promesa con timeout corto (5s) para el arranque inicial
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout Supabase")), 5000));

        const { data: { session }, error: sessionError } = await Promise.race([sessionPromise, timeoutPromise]) as any;

        if (sessionError) throw sessionError;

        if (session?.user) {
          console.log("👤 Sesión detectada:", session.user.email);
          // Usamos getUser para validar CONTRA EL SERVIDOR que el token sea vigente
          const { data: { user: verifiedUser }, error: userError } = await supabase.auth.getUser();

          if (userError || !verifiedUser) {
            console.warn("⚠️ Token almacenado no es válido en el servidor. Limpiando...");
            await supabase.auth.signOut();
            if (isMounted) setUser(null);
          } else {
            const { data: profile } = await supabase.from('profiles').select('*, procesos(*)').eq('id', verifiedUser.id).maybeSingle();
            if (isMounted) setUser(profile ? { ...profile, email: verifiedUser.email } : null);
          }
        } else {
          console.log("ℹ️ No hay sesión activa.");
          if (isMounted) setUser(null);
        }
      } catch (e: any) {
        console.error("❌ Fallo crítico en verificación de sesión:", e.message);
        // Si hay error (como timeout o sesión corrupta), forzamos salida para que el usuario pueda loguearse de nuevo
        if (isMounted) setUser(null);
      } finally {
        console.log("✅ Verificación terminada.");
        if (isMounted) setLoading(false);
        clearTimeout(safetyTimeout);
      }
    };

    sessionCheck();

    // Escuchador de cambios en tiempo real
    const { data: authListener } = supabase.auth.onAuthStateChange(async (e, session) => {
      if (e === 'SIGNED_OUT') {
        if (isMounted) setUser(null);
      } else if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*, procesos(*)').eq('id', session.user.id).maybeSingle();
        if (isMounted) setUser(profile ? { ...profile, email: session.user.email } : null);
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  if (loading) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs font-bold uppercase tracking-widest">Cargando Sur Company...</span>
    </div>
  );

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut }}>
      <Router>
        <Suspense fallback={<div className="h-screen w-screen bg-slate-900 flex items-center justify-center"><LoadingScreen /></div>}>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            <Route path="/*" element={<ProtectedRoute user={user} />}>
              <Route index element={<Dashboard />} />
              <Route path="matriz" element={<MatrizIndicadores />} />
              <Route path="registro" element={<RegistroIndicadores />} />
              <Route path="procesos" element={<ProcesosView />} />
              <Route path="historico" element={<Historico />} />
              {/* FIX SEGURIDAD: Ruta admin ahora protegida por rol (AdminRoute) */}
              <Route path="admin" element={<AdminRoute user={user} />}>
                <Route index element={<AdminPanel />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </AuthContext.Provider>
  );
};

// FIX SEGURIDAD: Componente que restringe el acceso solo a Administradores.
// Cualquier usuario autenticado que no sea Admin es redirigido al inicio.
const AdminRoute: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  if (user?.role !== 'Administrador') return <Navigate to="/" replace />;
  return <Outlet />;
};

// Componente Protegido
const ProtectedRoute: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const location = useLocation();
  const { signOut, loading } = useAuth();

  // FIX: Si todavía está cargando la sesión (ej. al dar F5), mostramos la pantalla de carga 
  // en lugar de redirigir inmediatamente a /login.
  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#f3f4f6]">
      <LoadingScreen />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  const isAdmin = user.role === 'Administrador';

  return (
    <div className="flex flex-col min-h-screen bg-[#f3f4f6] font-sans">
      {/* HEADER */}
      <header className="bg-[#1e293b] text-white h-16 flex items-center justify-between px-8 shadow-md z-50">
        <div className="flex items-center gap-3">
          {/* #8: Logo personalizado en el header */}
          <div className="w-9 h-9 rounded-full bg-white overflow-hidden flex items-center justify-center border-2 border-white/20 shadow-lg flex-shrink-0">
            <img src="/logof.png" alt="Logo SUR COMPANY" className="w-full h-full object-contain p-0.5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight leading-none uppercase">INDICADORES DE PROCESO</h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase">SUR COMPANY SAS</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">{user.full_name || 'Usuario'}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{user.role}</p>
          </div>

          {/* #9: Confirmación de cierre de sesión */}
          <button
            onClick={async () => {
              const result = await Swal.fire({
                title: '¿Cerrar sesión?',
                text: 'Se cerrará tu sesión actual.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#b91c1c',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Sí, salir',
                cancelButtonText: 'Cancelar',
              });
              if (result.isConfirmed) signOut();
            }}
            className="flex items-center gap-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold border border-slate-700 transition-all cursor-pointer active:scale-95"
          >
            <LogOut size={14} /> Salir
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 px-8 py-2 shadow-sm sticky top-0 z-40">
        <nav className="flex justify-start gap-2 overflow-x-auto">
          <NavItem to="/" label={isAdmin ? 'Vista General' : 'Mi Vista'} icon={<LayoutGrid size={16} />} active={location.pathname === '/'} />
          {isAdmin && (
            <>
              <NavItem to="/matriz" label="Matriz de Indicadores" icon={<ClipboardList size={16} />} active={location.pathname === '/matriz'} />
              <NavItem to="/procesos" label="Procesos" icon={<Building2 size={16} />} active={location.pathname === '/procesos'} />
            </>
          )}
          {!isAdmin && <NavItem to="/registro" label="Registrar Indicador" icon={<FilePlus2 size={16} />} active={location.pathname === '/registro'} />}
          <NavItem to="/historico" label="Histórico" icon={<History size={16} />} active={location.pathname === '/historico'} />
          {isAdmin && <NavItem to="/admin" label="Configuración" icon={<Settings size={16} />} active={location.pathname === '/admin'} />}
        </nav>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-8 animate-in fade-in zoom-in-95 duration-300">
        <Suspense fallback={<LoadingScreen />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

const NavItem: React.FC<{ to: string; label: string; icon: React.ReactNode; active: boolean }> = ({ to, label, icon, active }) => (
  <Link to={to} className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${active ? 'bg-slate-900 text-white shadow-md transform scale-105' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>
    {icon} <span>{label}</span>
  </Link>
);

export default App;