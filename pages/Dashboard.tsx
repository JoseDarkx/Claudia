import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../App';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Label, Legend 
} from 'recharts';
import { RegistroMensual, Proceso } from '../types';
import { Activity, Target, CheckCircle2, XCircle, X, List, TrendingUp, User } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) return null;

  // Renderizado condicional según el rol
  return user.role === 'Administrador' ? <AdminDashboard /> : <LeaderDashboard user={user} />;
};

// ==========================================
// 1. VISTA DE ADMINISTRADOR (Vista General)
// ==========================================
const AdminDashboard = () => {
  const [registros, setRegistros] = useState<RegistroMensual[]>([]);
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalInfo, setModalInfo] = useState<{ title: string; data: any[]; type: 'proceso' | 'indicador' } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pRes, rRes] = await Promise.all([
            supabase.from('procesos').select('id, codigo_proceso, nombre_proceso').order('codigo_proceso'),
            supabase.from('registro_mensual_indicadores')
                .select('id, proceso_id, periodo, porcentaje_cumplimiento, resultado_mensual, meta, cumple_meta, unidad_medida, indicadores(nombre_indicador), procesos(nombre_proceso)')
                .order('periodo', { ascending: false })
                .limit(300)
        ]);

        setProcesos(pRes.data || []);
        setRegistros(rRes.data || []);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const ultimoPeriodo = useMemo(() => registros?.[0]?.periodo, [registros]);
  const actuales = useMemo(() => registros.filter((r: any) => r.periodo === ultimoPeriodo), [registros, ultimoPeriodo]);
  
  const barData = useMemo(() => {
    return (procesos || []).map((p: any) => {
      const regs = actuales.filter((r: any) => r.proceso_id === p.id);
      const prom = regs.length > 0 ? regs.reduce((a, c) => a + Number(c.porcentaje_cumplimiento || 0), 0) / regs.length : 0;
      return { 
        id: p.id,
        name: p.codigo_proceso, 
        fullName: p.nombre_proceso,
        val: Math.round(prom),
        fill: prom >= 90 ? '#10b981' : prom >= 70 ? '#f59e0b' : '#ef4444'
      };
    });
  }, [procesos, actuales]);

  const cumplimientoGlobal = useMemo(() => {
    if (barData.length === 0) return 0;
    return Math.round(barData.reduce((acc, curr) => acc + curr.val, 0) / barData.length);
  }, [barData]);

  const procesosCumplen = barData.filter(d => d.val >= 80);
  const procesosIncumplen = barData.filter(d => d.val < 80);

  const handleCardClick = (tipo: string) => {
    if (tipo === 'total') setModalInfo({ title: "Listado General de Procesos", data: barData.sort((a,b) => b.val - a.val), type: 'proceso' });
    else if (tipo === 'activos') setModalInfo({ title: `Indicadores Reportados (${ultimoPeriodo || 'N/A'})`, data: actuales, type: 'indicador' });
    else if (tipo === 'cumplen') setModalInfo({ title: "Procesos con Cumplimiento Satisfactorio (≥80%)", data: procesosCumplen.sort((a,b) => b.val - a.val), type: 'proceso' });
    else if (tipo === 'incumplen') setModalInfo({ title: "Procesos en Riesgo (<80%)", data: procesosIncumplen.sort((a,b) => a.val - b.val), type: 'proceso' });
  };

  if (loading) return <div className="p-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Cargando Panorama General...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="bg-gradient-to-r from-[#b91c1c] to-[#0f172a] rounded-2xl p-8 text-white shadow-lg flex items-center gap-6 relative overflow-hidden">
         <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight mb-1">Vista General</h2>
            <p className="text-red-100 text-sm font-medium opacity-90">Consolidado de indicadores y procesos</p>
         </div>
         <Activity size={48} className="absolute right-10 top-1/2 -translate-y-1/2 text-white/10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KpiCard title="Total Procesos" value={procesos.length} icon={<Target size={24} />} color="bg-blue-600" onClick={() => handleCardClick('total')} />
          <KpiCard title="Indicadores Activos" value={actuales.length} icon={<Activity size={24} />} color="bg-purple-600" onClick={() => handleCardClick('activos')} />
          <KpiCard title="Procesos que Cumplen" value={procesosCumplen.length} icon={<CheckCircle2 size={24} />} color="bg-green-600" valColor="text-green-600" onClick={() => handleCardClick('cumplen')} />
          <KpiCard title="Procesos Incumplen" value={procesosIncumplen.length} icon={<XCircle size={24} />} color="bg-red-600" valColor="text-red-600" onClick={() => handleCardClick('incumplen')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">Cumplimiento por Proceso - {ultimoPeriodo}</h3>
             <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                      {barData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative">
             <h3 className="absolute top-6 left-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Cumplimiento Global</h3>
             <div className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={[{value: cumplimientoGlobal}, {value: 100-cumplimientoGlobal}]} innerRadius={80} outerRadius={100} startAngle={90} endAngle={-270} dataKey="value">
                            <Cell fill={cumplimientoGlobal >= 80 ? '#10b981' : '#f59e0b'} />
                            <Cell fill="#f1f5f9" />
                            <Label value={`${cumplimientoGlobal}%`} position="center" className="text-4xl font-bold fill-slate-800" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
             </div>
             <p className="text-xs text-slate-400 font-bold uppercase mt-[-20px]">Cumplimiento General</p>
          </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
         <h3 className="text-xs font-bold text-slate-800 mb-4">Semaforización de Indicadores - Periodo Actual</h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LegendBox color="bg-green-500" text="Verde - Cumple" subtext={`${Math.round((procesosCumplen.length/procesos.length)*100 || 0)}% del total`} />
            <LegendBox color="bg-yellow-400" text="Amarillo - En Seguimiento" subtext={`${Math.round(((procesos.length - procesosCumplen.length - procesosIncumplen.length)/procesos.length)*100 || 0)}% del total`} />
            <LegendBox color="bg-red-500" text="Rojo - No Cumple" subtext={`${Math.round((procesosIncumplen.length/procesos.length)*100 || 0)}% del total`} />
         </div>
      </div>

      {modalInfo && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setModalInfo(null)}>
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">{modalInfo.title}</h3>
                    <button onClick={() => setModalInfo(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"><X size={20} /></button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
                    {modalInfo.data.length === 0 ? <div className="text-center text-slate-400 text-sm py-8">Sin datos.</div> : modalInfo.data.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                                {modalInfo.type === 'proceso' ? (
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white ${item.val >= 80 ? 'bg-green-500' : 'bg-red-500'}`}>{item.val}%</div>
                                ) : (
                                    <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Activity size={18} /></div>
                                )}
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">{modalInfo.type === 'proceso' ? item.fullName : item.indicadores?.nombre_indicador}</p>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{modalInfo.type === 'proceso' ? item.name : item.procesos?.nombre_proceso}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                {modalInfo.type === 'proceso' ? (
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${item.val >= 80 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{item.val >= 80 ? 'Cumple' : 'Riesgo'}</span>
                                ) : (
                                    <>
                                        <p className="text-lg font-black text-slate-900 leading-none">{item.resultado_mensual}{item.unidad_medida?.includes('%') ? '%' : ''}</p>
                                        <p className={`text-[10px] font-bold mt-1 ${item.cumple_meta ? 'text-green-600' : 'text-red-600'}`}>Meta: {item.meta}{item.unidad_medida?.includes('%') ? '%' : ''}</p>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. VISTA DE LÍDER (Mi Vista)
// ==========================================
const LeaderDashboard = ({ user }: { user: any }) => {
  const [registros, setRegistros] = useState<RegistroMensual[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: graphData } = await supabase
            .from('registro_mensual_indicadores')
            .select('id, indicador_id, resultado_mensual, meta, periodo, cumple_meta, estado_registro, accion_mejora, indicadores(codigo_indicador, nombre_indicador)')
            .eq('proceso_id', user.proceso_id)
            .order('periodo', { ascending: false })
            .limit(20); 

        setRegistros(graphData || []);
        (window as any).tempGraphData = graphData; 
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, [user]);

  const chartData = useMemo(() => {
      const raw = (window as any).tempGraphData || [];
      if (raw.length === 0) return [];
      const lastPeriod = raw[0].periodo;
      return raw
        .filter((r: any) => r.periodo === lastPeriod)
        .map((r: any) => ({
            name: r.indicadores?.codigo_indicador,
            Meta: r.meta,
            Resultado: r.resultado_mensual
        }));
  }, [registros]);

  const ultimoPeriodo = registros[0]?.periodo || 'N/A';
  const totalRegistros = registros.length;
  const cumplen = registros.filter(r => r.cumple_meta).length;
  const noCumplen = registros.filter(r => !r.cumple_meta).length;
  const porcentaje = totalRegistros > 0 ? Math.round((cumplen / totalRegistros) * 100) : 0;

  if (loading) return <div className="p-10 text-center text-slate-400 text-xs font-bold uppercase">Cargando Mi Vista...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-gradient-to-r from-[#b91c1c] to-[#0f172a] rounded-2xl p-8 text-white shadow-lg flex items-center gap-6 relative overflow-hidden">
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm"><User size={32} className="text-white" /></div>
            <div className="relative z-10">
                <h2 className="text-2xl font-bold tracking-tight mb-1">Mi Vista - {user.procesos?.codigo_proceso}</h2>
                <p className="text-red-100 text-sm font-medium opacity-90">{user.procesos?.nombre_proceso}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                <div><p className="text-[10px] font-bold text-slate-500 uppercase">Total Registros</p><p className="text-3xl font-bold text-slate-800">{totalRegistros}</p></div>
                <div className="bg-blue-600 text-white p-3 rounded-lg"><List size={20}/></div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                <div><p className="text-[10px] font-bold text-slate-500 uppercase">Indicadores Cumplen</p><p className="text-3xl font-bold text-green-600">{cumplen}</p></div>
                <div className="bg-green-100 text-green-600 p-3 rounded-lg"><CheckCircle2 size={20}/></div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                <div><p className="text-[10px] font-bold text-slate-500 uppercase">Indicadores Incumplen</p><p className="text-3xl font-bold text-red-600">{noCumplen}</p></div>
                <div className="bg-red-100 text-red-600 p-3 rounded-lg"><XCircle size={20}/></div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                <div><p className="text-[10px] font-bold text-slate-500 uppercase">% Cumplimiento</p><p className="text-3xl font-bold text-slate-800">{porcentaje}%</p></div>
                <div className="bg-[#b91c1c] text-white p-3 rounded-lg"><TrendingUp size={20}/></div>
            </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-6">Resultado vs Meta - Periodo {ultimoPeriodo}</h3>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={0} barCategoryGap="30%">
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{fontSize: 11, fill:'#64748b'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 11, fill:'#64748b'}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Legend wrapperStyle={{fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px'}} />
                        <Bar dataKey="Meta" fill="#10b981" name="Meta Esperada" radius={[4,4,0,0]} />
                        <Bar dataKey="Resultado" fill="#b91c1c" name="Resultado Obtenido" radius={[4,4,0,0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest">Mis Registros Recientes</h3>
            {registros.map((reg) => (
                <div key={reg.id} className="border border-slate-100 p-6 rounded-xl hover:border-slate-300 transition-all">
                    <div className="flex justify-between items-start mb-4 border-b border-slate-50 pb-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-red-700 font-bold text-sm">{reg.indicadores?.codigo_indicador}</span>
                                <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 uppercase">{reg.periodo}</span>
                                <span className={`flex items-center gap-1 text-[10px] font-bold uppercase ${reg.cumple_meta ? 'text-green-600' : 'text-red-600'}`}>
                                    <div className={`w-2 h-2 rounded-full ${reg.cumple_meta ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    {reg.cumple_meta ? 'Cumple' : 'No Cumple'}
                                </span>
                            </div>
                            <h4 className="text-base font-bold text-slate-800">{reg.indicadores?.nombre_indicador}</h4>
                        </div>
                        <span className="bg-black text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase">{reg.estado_registro}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div><span className="text-slate-400 font-bold uppercase block text-[9px]">Resultado:</span><span className="font-medium text-slate-700">{reg.resultado_mensual}% (Meta: {reg.meta}%)</span></div>
                        <div><span className="text-slate-400 font-bold uppercase block text-[9px]">Acción:</span><span className="font-medium text-slate-700 truncate block">{reg.accion_mejora || 'Sin acción'}</span></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

const KpiCard = ({ title, value, icon, color, valColor = "text-slate-800", onClick }: any) => (
    <div onClick={onClick} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-start hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group">
        <div><p className="text-[11px] text-slate-500 font-bold mb-1 group-hover:text-slate-800">{title}</p><p className={`text-3xl font-bold ${valColor}`}>{value}</p></div>
        <div className={`p-3 rounded-lg text-white ${color} shadow-md group-hover:scale-110 transition-transform`}>{icon}</div>
    </div>
);

const LegendBox = ({ color, text, subtext }: any) => (
    <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-lg bg-slate-50"><div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${color}`}>%</div><div><p className="text-xs font-bold text-slate-700">{text}</p><p className="text-[10px] text-slate-400 font-bold">{subtext}</p></div></div>
);

export default Dashboard;