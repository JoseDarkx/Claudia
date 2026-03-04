import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;
    } catch (err: any) {
      setError("Credenciales incorrectas. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* FONDO DEGRADADO ROJO VIBRANTE (Inspirado en tu imagen) */
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_center,_#991b1b_0%,_#450a0a_100%)] px-6 relative overflow-hidden">

      <div className="max-w-md w-full animate-in fade-in zoom-in duration-700 relative z-10">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden border-4 border-slate-900/5">

          {/* Barra superior decorativa */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-700 via-red-600 to-slate-900"></div>

          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-6 border-4 border-slate-50 shadow-xl overflow-hidden p-2">
              {/* Logo personalizado del cliente */}
              <img
                src="/logof.png"
                alt="Logo SUR COMPANY"
                className="w-full h-full object-contain"
              />
            </div>
            {/* NOMBRES ORIGINALES */}
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter mb-1 uppercase">SUR COMPANY SAS</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.4em]">Plataforma de Indicadores</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Usuario / Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:border-slate-900 outline-none transition-all text-slate-800 font-bold text-sm"
                  placeholder="usuario@surcompany.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:border-slate-900 outline-none transition-all text-sm font-bold text-slate-800 pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold text-center rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-4 rounded-full shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? "Validando..." : (
                <>
                  <Lock size={18} />
                  <span>Iniciar sesión</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-50 text-center space-y-4">
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="text-[9px] text-slate-400 hover:text-red-500 font-bold uppercase tracking-widest transition-colors"
            >
              ¿Problemas para entrar? Reparar Acceso
            </button>
            <p className="text-[8px] text-slate-300 font-bold uppercase tracking-widest">© 2026 SUR COMPANY SAS - SGI</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;