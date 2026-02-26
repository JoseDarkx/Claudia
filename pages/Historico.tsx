import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../App';
import { RegistroMensual, Indicador, Proceso } from '../types';
import { History, Filter, ChevronLeft, ChevronRight, Edit2, Trash2, TrendingUp, TrendingDown, LayoutDashboard, List as ListIcon, Calendar, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Cell } from 'recharts';

const Historico: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [registros, setRegistros] = useState<RegistroMensual[]>([]);
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Filtros
  const [filterProceso, setFilterProceso] = useState('Todos los procesos');
  const [filterIndicador, setFilterIndicador] = useState('Todos los indicadores');
  const [filterFrecuencia, setFilterFrecuencia] = useState('Todas');
  const [filterDesde, setFilterDesde] = useState('2025-01');
  const [filterHasta, setFilterHasta] = useState('2026-12');

  // 🔥 SEGURIDAD: El dashboard solo arranca en true si el usuario es Administrador
  const [showDashboard, setShowDashboard] = useState(user?.role === 'Administrador');

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro permanentemente?')) return;
    try {
      const { error } = await supabase.from('registro_mensual_indicadores').delete().eq('id', id);
      if (error) throw error;
      setRegistros(prev => prev.filter(r => r.id !== id));
      alert('Registro eliminado correctamente');
    } catch (e: any) {
      alert('Error al eliminar: ' + e.message);
    }
  };

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

  // EFECTO 2: Aplicar filtros si vienen de otra página
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

  // Lógica de Filtrado y Seguridad
  const getYearMonth = (fecha: string) => fecha?.substring(0, 7) ?? '';

  const filtered = registros.filter(r => {
    // 🔒 REGLA DE SEGURIDAD PRINCIPAL: Control de Datos
    const esAdmin = user?.role === 'Administrador';
    const esMiArea = r.usuario_sistema === user?.id; // Verifica si el registro pertenece al líder actual

    // Si no es Administrador y el registro no es suyo, lo ocultamos inmediatamente
    if (!esAdmin && !esMiArea) return false;

    // Filtros visuales normales
    const matchProceso = filterProceso === 'Todos los procesos' || r.procesos?.nombre_proceso === filterProceso;
    const matchIndicador = filterIndicador === 'Todos los indicadores' || r.indicadores?.nombre_indicador === filterIndicador;
    const matchFrecuencia = filterFrecuencia === 'Todas' || r.indicadores?.frecuencia === filterFrecuencia;
    const matchFecha = getYearMonth(r.periodo) >= filterDesde && getYearMonth(r.periodo) <= filterHasta;

    return matchProceso && matchIndicador && matchFrecuencia && matchFecha;
  });

  // Lógica para el Dashboard Histórico (Tarjetas y resumen)
  const dashboardData = useMemo(() => {
    const porIndicador: Record<string, {
      nombre: string,
      codigo: string,
      datos: { periodo: string, val: number, semaforo: string }[],
      registrosTotales: number,
      actual: number,
      anterior: number,
      variacion: number | null,
      semaforoActual: string
    }> = {};

    const sorted = [...filtered].sort((a, b) => a.periodo.localeCompare(b.periodo));

    sorted.forEach(r => {
      const key = r.indicador_id;
      if (!porIndicador[key]) {
        porIndicador[key] = {
          nombre: r.indicadores?.nombre_indicador || 'N/A',
          codigo: r.indicadores?.codigo_indicador || 'N/A',
          datos: [],
          registrosTotales: 0,
          actual: 0,
          anterior: 0,
          variacion: null,
          semaforoActual: 'Verde'
        };
      }
      porIndicador[key].datos.push({
        periodo: r.periodo,
        val: Math.round(r.porcentaje_cumplimiento),
        semaforo: r.semaforo
      });
    });

    Object.keys(porIndicador).forEach(key => {
      const ind = porIndicador[key];
      const n = ind.datos.length;
      ind.registrosTotales = n;
      if (n > 0) {
        ind.actual = Math.round(ind.datos[n - 1].val);
        ind.semaforoActual = ind.datos[n - 1].semaforo;
        if (n > 1) {
          ind.anterior = Math.round(ind.datos[n - 2].val);
          if (ind.anterior !== 0) {
            ind.variacion = Math.round(((ind.actual - ind.anterior) / ind.anterior) * 100);
          }
        }
      }
    });

    return Object.values(porIndicador);
  }, [filtered]);

  // Datos para la gráfica de LÍNEAS consolidada
  const lineChartData = useMemo(() => {
    const periodos = Array.from(new Set(filtered.map(r => r.periodo))).sort();
    return periodos.map(p => {
      const entry: any = { name: p };
      dashboardData.forEach(ind => {
        const d = ind.datos.find(x => x.periodo === p);
        if (d) entry[ind.codigo] = d.val;
      });
      return entry;
    });
  }, [dashboardData, filtered]);

  const COLORS = ['#b91c1c', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#475569'];

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // 🔥 SEGURIDAD EN FILTROS: Limita los procesos e indicadores que puede ver el líder en los dropdowns

  // 1. Identificamos cuáles procesos le pertenecen realmente a este líder (basado en sus registros)
  const misProcesosIds = useMemo(() => {
    if (user?.role === 'Administrador') return [];
    return Array.from(new Set(registros.filter(r => r.usuario_sistema === user?.id).map(r => r.proceso_id)));
  }, [registros, user]);

  // 2. Filtramos la lista de procesos para el dropdown
  const procesosDisponibles = useMemo(() => {
    return user?.role === 'Administrador'
      ? procesos
      : procesos.filter(p => misProcesosIds.includes(p.id));
  }, [procesos, user, misProcesosIds]);

  // 3. Filtramos la lista de indicadores con doble candado (Rol + Filtro seleccionado)
  const indicadoresDisponibles = useMemo(() => {
    // Candado A: Sacamos solo los indicadores que le pertenecen a los procesos del líder
    const indicadoresPermitidos = user?.role === 'Administrador'
      ? indicadores
      : indicadores.filter(i => misProcesosIds.includes(i.proceso_id));

    // Candado B: Aplicamos el filtro del dropdown actual
    if (filterProceso === 'Todos los procesos') {
      return indicadoresPermitidos;
    } else {
      const procSeleccionado = procesosDisponibles.find(p => p.nombre_proceso === filterProceso);
      return indicadoresPermitidos.filter(i => i.proceso_id === procSeleccionado?.id);
    }
  }, [indicadores, filterProceso, procesosDisponibles, user, misProcesosIds]);

  if (loading) return <div className="p-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Cargando Histórico...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">

      {/* 1. BANNER ROJO */}
      <div className="bg-gradient-to-r from-[#b91c1c] to-[#0f172a] rounded-2xl p-8 text-white shadow-lg flex items-center gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold tracking-tight mb-1">Histórico</h2>
          <p className="text-red-100 text-sm font-medium opacity-90">Consulta histórica de tendencias y registros</p>
        </div>
        <History size={48} className="absolute right-10 top-1/2 -translate-y-1/2 text-white/10" />
      </div>

      {/* 2. FILTROS */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proceso</label>
          <select value={filterProceso} onChange={e => {
            setFilterProceso(e.target.value);
            setFilterIndicador('Todos los indicadores');
            setCurrentPage(1);
          }} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none">
            {/* 🔥 Opción dinámica para no romper el filtro interno */}
            <option value="Todos los procesos">
              {user?.role === 'Administrador' ? 'Todos los procesos' : 'Todos mis procesos'}
            </option>
            {procesosDisponibles.map(p => <option key={p.id}>{p.nombre_proceso}</option>)}
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
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Frecuencia</label>
          <select value={filterFrecuencia} onChange={e => setFilterFrecuencia(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none">
            <option value="Todas">Todas</option>
            <option value="Mensual">Mensuales</option>
            <option value="Trimestral">Trimestrales</option>
            <option value="Anual">Anuales</option>
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

      {/* 3. TOGGLE VISTA */}
      <div className="flex justify-between items-center px-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Mostrando {filtered.length} registros
        </p>

        {/* 🔥 SEGURIDAD: Los botones del Dashboard solo los ve el Administrador */}
        {user?.role === 'Administrador' && (
          <div className="bg-slate-100 rounded-lg p-1 flex gap-1 border border-slate-200 shadow-inner">
            <button
              onClick={() => setShowDashboard(true)}
              className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all flex items-center gap-2 ${showDashboard ? 'bg-white text-red-700 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
            >
              <LayoutDashboard size={14} /> Dashboard
            </button>
            <button
              onClick={() => setShowDashboard(false)}
              className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all flex items-center gap-2 ${!showDashboard ? 'bg-white text-red-700 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
            >
              <ListIcon size={14} /> Lista
            </button>
          </div>
        )}
      </div>

      {/* 🔥 SEGURIDAD: El bloque del Dashboard solo se renderiza si es Admin y está activo */}
      {showDashboard && user?.role === 'Administrador' ? (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">

          {/* === GRÁFICA DE TENDENCIA (LÍNEAS DELGADAS MULTICOLOR) === */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
              <TrendingUp size={20} className="text-red-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Tendencia de Cumplimiento (%)</h3>
            </div>
            <div className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={lineChartData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

                  <ReferenceLine
                    y={100}
                    stroke="#fbbf24"
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                    label={{ position: 'right', value: 'Meta', fill: '#b45309', fontSize: 10, fontWeight: 'bold' }}
                  />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                    domain={[0, 'auto']}
                    tickFormatter={(value) => `${value}%`}
                  />

                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                    labelStyle={{ fontWeight: '800', color: '#0f172a', marginBottom: '8px', fontSize: '13px' }}
                    itemStyle={{ fontWeight: '600', fontSize: '12px', padding: '2px 0' }}
                    formatter={(value: any) => [`${value}%`, 'Cumplimiento']}
                  />

                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', color: '#475569' }}
                  />

                  {dashboardData.map((ind, index) => (
                    <Line
                      key={ind.codigo}
                      type="monotone"
                      dataKey={ind.codigo}
                      name={`${ind.codigo} - ${ind.nombre}`}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2.5}
                      dot={{ r: 3.5, strokeWidth: 1.5, fill: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      connectNulls={true}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TARJETAS DE RESUMEN */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardData.map((ind) => (
              <div key={ind.codigo} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all border-l-4" style={{ borderLeftColor: ind.semaforoActual === 'Verde' ? '#10b981' : ind.semaforoActual === 'Amarillo' ? '#f59e0b' : '#ef4444' }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-slate-50 p-2 rounded-lg text-slate-400 group-hover:text-red-600 transition-colors">
                    <Activity size={18} />
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${ind.variacion === null ? 'text-slate-400' : ind.variacion >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {ind.variacion !== null && (ind.variacion >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />)}
                    {ind.variacion === null ? 'Sin historial suficiente' : `${Math.abs(ind.variacion)}% vs anterior`}
                  </div>
                </div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 truncate" title={ind.codigo}>{ind.codigo}</h4>
                <p className="text-sm font-bold text-slate-800 line-clamp-1 mb-4" title={ind.nombre}>{ind.nombre}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-3xl font-black text-slate-900">{ind.actual}%</span>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Último periodo registrado</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full shadow-sm animate-pulse ${ind.semaforoActual === 'Verde' ? 'bg-green-500' : ind.semaforoActual === 'Amarillo' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                </div>
              </div>
            ))}
          </div>

        </div>
      ) : (
        // VISTA DE LISTA (Para Líderes o Administrador cuando oculta el Dashboard)
        <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
          {paginated.length === 0 ? (
            <div className="p-10 bg-white rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-sm font-bold uppercase">No se encontraron registros con estos filtros en tu área.</div>
          ) : paginated.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-all animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-start mb-4 border-b border-slate-50 pb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-red-700 font-bold text-sm">{r.indicadores?.codigo_indicador}</span>
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 uppercase">{r.procesos?.codigo_proceso}</span>
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 uppercase flex items-center gap-1"><Calendar size={10} /> {r.periodo}</span>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.semaforo === 'Verde' ? 'bg-green-50 text-green-700' : r.semaforo === 'Amarillo' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                      <div className={`w-2 h-2 rounded-full ${r.semaforo === 'Verde' ? 'bg-green-500' : r.semaforo === 'Amarillo' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                      {r.semaforo === 'Verde' ? 'Cumple' : r.semaforo === 'Amarillo' ? 'En Seguimiento' : 'No Cumple'}
                    </div>
                  </div>
                  <h4 className="text-base font-bold text-slate-800">{r.indicadores?.nombre_indicador}</h4>
                  <p className="text-xs text-slate-400">{r.procesos?.nombre_proceso}</p>
                </div>
                <div className="text-right">
                  {(() => {
                    const unidad = r.unidad_medida?.trim() === '%' ? '%' : (r.unidad_medida ? ` ${r.unidad_medida}` : '');
                    return (
                      <>
                        <span className="block text-3xl font-black text-slate-900 leading-none">{Math.round(r.resultado_mensual || 0)}<span className="text-lg">{unidad}</span></span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Meta: {r.meta}{unidad}</span>
                        <p className={`text-[10px] font-bold uppercase mt-1 ${r.cumple_meta ? 'text-green-600' : 'text-red-600'}`}>{r.cumple_meta ? '✓ Cumple Meta' : '✕ No Cumple Meta'}</p>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50/50 p-4 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><Activity size={10} /> Análisis del Resultado</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{r.observaciones || 'Sin análisis registrado.'}</p>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><TrendingUp size={10} /> Plan de Acción</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{r.accion_mejora || 'Sin plan de acción registrado.'}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                <div className="flex items-center gap-4">
                  <span>Registrado por: <span className="font-bold text-slate-600">{r.nombre_responsable_registro}</span></span>
                  {r.estado_registro === 'Borrador' && user?.role === 'Líder de Proceso' && (
                    <button
                      onClick={() => {
                        window.location.hash = `#/registro?edit=${r.id}`;
                      }}
                      className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-lg border border-amber-100 hover:bg-amber-100 transition-colors font-bold uppercase cursor-pointer"
                    >
                      <Edit2 size={10} /> Editar Borrador
                    </button>
                  )}
                  {user?.role === 'Administrador' && (
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="flex items-center gap-1 bg-red-50 text-red-700 px-3 py-1 rounded-lg border border-red-100 hover:bg-red-100 transition-colors font-bold uppercase cursor-pointer"
                    >
                      <Trash2 size={10} /> Eliminar
                    </button>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full uppercase font-bold text-[10px] ${r.estado_registro === 'Finalizado' ? 'bg-slate-900 text-white' : 'bg-amber-100 text-amber-800'}`}>{r.estado_registro}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINACIÓN */}
      <div className="flex justify-center gap-4 mt-8 border-t border-slate-100 pt-8">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-all"><ChevronLeft size={16} /></button>
        <span className="text-xs font-bold text-slate-600 flex items-center bg-slate-50 px-4 rounded-lg border border-slate-200">Página {currentPage} de {totalPages}</span>
        <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-all"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
};

export default Historico;