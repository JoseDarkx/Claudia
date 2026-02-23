import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom'; // Importante: useLocation
import { supabase } from '../lib/supabase';
import { useAuth } from '../App';
import { RegistroMensual, Indicador, Proceso } from '../types';
import { History, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const Historico: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation(); // Hook para leer estado de navegación

  const [registros, setRegistros] = useState<RegistroMensual[]>([]);
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Filtros
  const [filterProceso, setFilterProceso] = useState('Todos los procesos');
  const [filterIndicador, setFilterIndicador] = useState('Todos los indicadores'); // Nuevo filtro
  const [filterDesde, setFilterDesde] = useState('2025-01');
  const [filterHasta, setFilterHasta] = useState('2026-12');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // EFECTO 1: Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [pRes, iRes, rRes] = await Promise.all([
        supabase.from('procesos').select('*'),
        supabase.from('indicadores').select('*'),
        supabase.from('registro_mensual_indicadores').select('*, indicadores(*), procesos(*)').order('periodo', { ascending: false }).limit(200)
      ]);
      setProcesos(pRes.data || []);
      setIndicadores(iRes.data || []);
      setRegistros(rRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // EFECTO 2: Aplicar filtros si vienen de otra página (ProcesosView)
  useEffect(() => {
    if (location.state) {
      if (location.state.filterProceso) {
        setFilterProceso(location.state.filterProceso);
      }
      if (location.state.filterIndicador) {
        setFilterIndicador(location.state.filterIndicador);
      }
    }
  }, [location.state]);

  // Lógica de Filtrado
  // FIX: Comparación de fechas robusta con helper explícito
  const getYearMonth = (fecha: string) => fecha?.substring(0, 7) ?? '';
  const filtered = registros.filter(r => {
    const matchProceso = filterProceso === 'Todos los procesos' || r.procesos?.nombre_proceso === filterProceso;
    const matchIndicador = filterIndicador === 'Todos los indicadores' || r.indicadores?.nombre_indicador === filterIndicador;
    const matchFecha = getYearMonth(r.periodo) >= filterDesde && getYearMonth(r.periodo) <= filterHasta;

    return matchProceso && matchIndicador && matchFecha;
  });

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // Generar opciones de indicadores dinámicamente según el proceso seleccionado
  const indicadoresDisponibles = filterProceso === 'Todos los procesos'
    ? indicadores
    : indicadores.filter(i => {
      const proc = procesos.find(p => p.nombre_proceso === filterProceso);
      return i.proceso_id === proc?.id;
    });

  if (loading) return <div className="p-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Cargando Histórico...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">

      {/* 1. BANNER ROJO */}
      <div className="bg-gradient-to-r from-[#b91c1c] to-[#0f172a] rounded-2xl p-8 text-white shadow-lg flex items-center gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold tracking-tight mb-1">Histórico</h2>
          <p className="text-red-100 text-sm font-medium opacity-90">Consulta histórica de todos los registros</p>
        </div>
        <History size={48} className="absolute right-10 top-1/2 -translate-y-1/2 text-white/10" />
      </div>

      {/* 2. FILTROS */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proceso</label>
          <select value={filterProceso} onChange={e => {
            setFilterProceso(e.target.value);
            setFilterIndicador('Todos los indicadores');
            setCurrentPage(1); // FIX: resetea página al filtrar
          }} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none">
            <option>Todos los procesos</option>
            {procesos.map(p => <option key={p.id}>{p.nombre_proceso}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Indicador</label>
          <select value={filterIndicador} onChange={e => setFilterIndicador(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none">
            <option>Todos los indicadores</option>
            {indicadoresDisponibles.map(i => <option key={i.id}>{i.nombre_indicador}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Desde</label>
          <input type="month" value={filterDesde} onChange={e => { setFilterDesde(e.target.value); setCurrentPage(1); }} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hasta</label>
          <input type="month" value={filterHasta} onChange={e => { setFilterHasta(e.target.value); setCurrentPage(1); }} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none" />
        </div>
      </div>

      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
        Mostrando {filtered.length} registros
        {filterIndicador !== 'Todos los indicadores' && <span className="ml-2 text-red-600">• Filtrado por: {filterIndicador}</span>}
      </p>

      {/* 3. LISTA DE REGISTROS */}
      <div className="space-y-4">
        {paginated.length === 0 ? (
          <div className="p-10 bg-white rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-sm">No se encontraron registros con estos filtros.</div>
        ) : paginated.map(r => (
          <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-all animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-start mb-4 border-b border-slate-50 pb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-red-700 font-bold text-sm">{r.indicadores?.codigo_indicador}</span>
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 uppercase">{r.procesos?.codigo_proceso}</span>
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 uppercase">{r.periodo}</span>
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.semaforo === 'Verde' ? 'bg-green-50 text-green-700' : r.semaforo === 'Amarillo' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                    <div className={`w-2 h-2 rounded-full ${r.semaforo === 'Verde' ? 'bg-green-500' : r.semaforo === 'Amarillo' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    {r.semaforo === 'Verde' ? 'Cumple' : r.semaforo === 'Amarillo' ? 'En Seguimiento' : 'No Cumple'}
                  </div>
                </div>
                <h4 className="text-base font-bold text-slate-800">{r.indicadores?.nombre_indicador}</h4>
                <p className="text-xs text-slate-400">{r.procesos?.nombre_proceso}</p>
              </div>
              <div className="text-right">
                {/* FIX: Unidad de medida dinámica en lugar de % hardcoded */}
                {(() => {
                  const unidad = r.unidad_medida?.includes('%') ? '%' : (r.unidad_medida ? ` ${r.unidad_medida}` : '');
                  return (
                    <>
                      <span className="block text-3xl font-black text-slate-900 leading-none">{r.resultado_mensual}{unidad}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Meta: {r.meta}{unidad}</span>
                      <p className={`text-[10px] font-bold uppercase mt-1 ${r.cumple_meta ? 'text-green-600' : 'text-red-600'}`}>{r.cumple_meta ? '✓ Cumple Meta' : '✕ No Cumple Meta'}</p>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Análisis del Resultado</p>
                <p className="text-xs text-slate-600">{r.observaciones || 'Sin análisis.'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Plan de Acción</p>
                <p className="text-xs text-slate-600">{r.accion_mejora || 'Sin plan.'}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400 font-medium">
              <span>Registrado por: {r.nombre_responsable_registro}</span>
              <span className="bg-slate-900 text-white px-3 py-1 rounded-full uppercase font-bold">{r.estado_registro}</span>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINACIÓN */}
      <div className="flex justify-center gap-4 mt-8">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"><ChevronLeft size={16} /></button>
        <span className="text-xs font-bold text-slate-600 flex items-center">Página {currentPage} de {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
};

export default Historico;