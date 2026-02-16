import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Indicador, Proceso } from '../types';
import { ClipboardList, Search, Filter } from 'lucide-react';

const MatrizIndicadores: React.FC = () => {
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [procFilter, setProcFilter] = useState('Todos');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [pRes, iRes] = await Promise.all([
        supabase.from('procesos').select('*'),
        supabase.from('indicadores').select('*, procesos(*)')
      ]);
      setProcesos(pRes.data || []);
      setIndicadores(iRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = indicadores.filter(i => {
    const matchesSearch = i.nombre_indicador.toLowerCase().includes(search.toLowerCase()) || i.codigo_indicador.toLowerCase().includes(search.toLowerCase());
    const matchesProc = procFilter === 'Todos' || i.proceso_id === procFilter;
    return matchesSearch && matchesProc;
  });

  if (loading) return <div className="p-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Cargando Matriz...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. BANNER ROJO */}
      <div className="bg-gradient-to-r from-[#b91c1c] to-[#0f172a] rounded-2xl p-8 text-white shadow-lg flex items-center gap-6 relative overflow-hidden">
        <div className="relative z-10">
           <h2 className="text-3xl font-bold tracking-tight mb-1">Matriz de Indicadores</h2>
           <p className="text-red-100 text-sm font-medium opacity-90">Hoja de vida completa de indicadores</p>
        </div>
        <ClipboardList size={48} className="absolute right-10 top-1/2 -translate-y-1/2 text-white/10" />
      </div>

      {/* 2. FILTROS */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-end">
        <div className="flex-1 w-full space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Buscar</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 outline-none transition-all" 
                placeholder="Código o nombre..." 
            />
          </div>
        </div>
        <div className="flex-1 w-full space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filtrar por Proceso</label>
          <select value={procFilter} onChange={e => setProcFilter(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer">
            <option value="Todos">Todos los procesos</option>
            {procesos.map(p => <option key={p.id} value={p.id}>{p.nombre_proceso}</option>)}
          </select>
        </div>
      </div>

      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Mostrando {filtered.length} indicadores</p>

      {/* 3. LISTA DE TARJETAS */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.map(i => (
          <div key={i.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-all group">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4 border-b border-slate-50 pb-4">
               <div>
                   <div className="flex items-center gap-3 mb-2">
                       <span className="text-red-700 font-bold text-sm tracking-tight">{i.codigo_indicador}</span>
                       <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 uppercase">{i.tipo_indicador}</span>
                       <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded border border-green-200 uppercase">Activo</span>
                   </div>
                   <h3 className="text-lg font-bold text-slate-800">{i.nombre_indicador}</h3>
                   <p className="text-xs text-slate-500 font-medium">Proceso: {i.procesos?.nombre_proceso}</p>
               </div>
               <div className="flex gap-8 text-right">
                   <div>
                       <span className="block text-[10px] font-bold text-slate-400 uppercase">Meta</span>
                       <span className="text-lg font-bold text-slate-900">{i.meta}{i.unidad_medida.includes('%') ? '%' : ''}</span>
                   </div>
                   <div>
                       <span className="block text-[10px] font-bold text-slate-400 uppercase">Frecuencia</span>
                       <span className="text-lg font-bold text-slate-900">{i.frecuencia}</span>
                   </div>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Descripción</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{i.descripcion || 'Sin descripción.'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Configuración Semáforo</p>
                    <div className="space-y-1 text-[10px] font-medium text-slate-600">
                        <div className="flex justify-between"><span>🟢 Verde (Cumple)</span> <span>≥ {i.umbral_verde}%</span></div>
                        <div className="flex justify-between"><span>🟡 Amarillo (Seguimiento)</span> <span>{i.umbral_amarillo}% - {i.umbral_verde - 1}%</span></div>
                        <div className="flex justify-between"><span>🔴 Rojo (No Cumple)</span> <span>&lt; {i.umbral_amarillo}%</span></div>
                    </div>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatrizIndicadores;