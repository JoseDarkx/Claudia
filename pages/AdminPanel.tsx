import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js'; 
import { Proceso, UserProfile, Indicador } from '../types';
import { Settings, Users, Activity, Plus, Edit2, Trash2, Filter, X, Save, AlertCircle } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'indicadores' | 'lideres'>('indicadores');
  const [procFilter, setProcFilter] = useState('Todos los procesos');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [iRes, uRes, pRes] = await Promise.all([
            supabase.from('indicadores').select('*, procesos(*)').order('codigo_indicador'),
            supabase.from('profiles').select('*, procesos(*)').order('full_name'),
            supabase.from('procesos').select('*').order('codigo_proceso')
        ]);
        
        setIndicadores(iRes.data || []);
        setUsuarios(uRes.data || []);
        setProcesos(pRes.data || []);
    } catch (e) {
        console.error("Error cargando datos:", e);
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (id: string, table: string) => {
    if (!confirm('¿Está seguro de eliminar este registro permanentemente?')) return;
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    try {
        const { error } = await supabaseAdmin.from(table).delete().eq('id', id);
        if (table === 'profiles' && !error) {
             await supabaseAdmin.auth.admin.deleteUser(id); 
        }
        if (error) throw error;
        await fetchData();
    } catch (err: any) {
        alert("Error al eliminar: " + err.message);
    }
  };

  const handleOpenModal = (item: any = null) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const filteredIndicadores = indicadores.filter(i => procFilter === 'Todos los procesos' || i.procesos?.nombre_proceso === procFilter);
  const filteredUsuarios = usuarios.filter(u => procFilter === 'Todos los procesos' || u.procesos?.nombre_proceso === procFilter);

  if (loading) return <div className="p-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Cargando Configuración...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      <div className="bg-gradient-to-r from-[#b91c1c] to-[#0f172a] rounded-2xl p-8 text-white shadow-lg flex items-center gap-6 relative overflow-hidden text-left">
        <div className="relative z-10">
           <h2 className="text-3xl font-bold tracking-tight mb-1">Configuración</h2>
           <p className="text-red-100 text-sm font-medium opacity-90">Gestión de indicadores y usuarios del sistema</p>
        </div>
        <Settings size={48} className="absolute right-10 top-1/2 -translate-y-1/2 text-white/10" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-1 flex gap-1 w-fit mx-auto shadow-sm">
         <button onClick={() => setActiveTab('indicadores')} className={`px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${activeTab === 'indicadores' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Activity size={14} /> Indicadores
         </button>
         <button onClick={() => setActiveTab('lideres')} className={`px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${activeTab === 'lideres' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Users size={14} /> Líderes
         </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm min-h-[500px]">
        
        <div className="flex flex-col md:flex-row justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
                <Filter size={16} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Filtrar:</span>
                <select value={procFilter} onChange={e => setProcFilter(e.target.value)} className="bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-lg px-3 py-2 outline-none w-full md:w-auto">
                    <option>Todos los procesos</option>
                    {procesos.map(p => <option key={p.id}>{p.nombre_proceso}</option>)}
                </select>
            </div>
            <button onClick={() => handleOpenModal()} className="w-full md:w-auto bg-[#b91c1c] hover:bg-red-800 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 transition-all">
                <Plus size={14} /> {activeTab === 'indicadores' ? 'Nuevo Indicador' : 'Nuevo Usuario'}
            </button>
        </div>

        {activeTab === 'lideres' ? (
          <div className="space-y-4">
            {filteredUsuarios.map((u) => (
                <div key={u.id} className="border border-slate-100 rounded-xl p-5 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-center group gap-4">
                  <div className="flex items-center gap-4 w-full text-left">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm uppercase">
                        {u.full_name ? u.full_name.charAt(0) : 'U'}
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800">{u.full_name || 'Sin Nombre'}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-bold ${u.role === 'Administrador' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>{u.role}</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{u.email} • {u.procesos?.nombre_proceso || 'Sin proceso asignado'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleOpenModal(u)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(u.id, 'profiles')} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredIndicadores.map((ind) => (
                <div key={ind.id} className="border border-slate-100 rounded-xl p-5 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start group gap-4">
                  <div className="space-y-2 flex-1 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-red-700">{ind.codigo_indicador}</span>
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 uppercase">{ind.tipo_indicador}</span>
                      <span className="bg-slate-100 text-slate-800 text-[10px] font-black px-2 py-0.5 rounded border border-slate-200 uppercase">{ind.procesos?.nombre_proceso}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${ind.estado === 'Activo' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>{ind.estado}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">{ind.nombre_indicador}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 italic">{ind.descripcion || 'Sin descripción'}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleOpenModal(ind)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(ind.id, 'indicadores')} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <Modal 
            type={activeTab} 
            item={editingItem} 
            procesos={procesos} 
            onClose={() => setIsModalOpen(false)} 
            onSave={() => { setIsModalOpen(false); fetchData(); }} 
        />
      )}
    </div>
  );
};

const Modal = ({ type, item, procesos, onClose, onSave }: any) => {
    const isEdit = !!item;
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState<any>(() => {
        if (type === 'indicadores') {
            return {
                codigo_indicador: item?.codigo_indicador || '',
                nombre_indicador: item?.nombre_indicador || '',
                proceso_id: item?.proceso_id || '',
                tipo_indicador: item?.tipo_indicador || 'Eficacia',
                descripcion: item?.descripcion || '',
                formula_calculo: item?.formula_calculo || '',
                meta: item?.meta || 0,
                unidad_medida: item?.unidad_medida || 'Porcentaje (%)',
                frecuencia: item?.frecuencia || 'Mensual',
                fuente_informacion: item?.fuente_informacion || '',
                umbral_verde: item?.umbral_verde || 80,
                umbral_amarillo: item?.umbral_amarillo || 70,
                estado: item?.estado || 'Activo'
            };
        } else {
            return {
                email: item?.email || '',
                password: '', 
                full_name: item?.full_name || '',
                role: item?.role || 'Líder de Proceso',
                proceso_id: item?.proceso_id || '',
            };
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        try {
            if (type === 'indicadores') {
                const payload = { 
                    ...formData, 
                    meta: Number(formData.meta), 
                    umbral_verde: Number(formData.umbral_verde), 
                    umbral_amarillo: Number(formData.umbral_amarillo),
                    proceso_id: formData.proceso_id === "" ? null : formData.proceso_id 
                };
                
                if (isEdit) {
                    const { error } = await supabaseAdmin.from('indicadores').update(payload).eq('id', item.id);
                    if (error) throw error;
                } else {
                    const { error } = await supabaseAdmin.from('indicadores').insert([payload]);
                    if (error) throw error;
                }
            } else {
                if (isEdit) {
                    const { error: profileError } = await supabaseAdmin.from('profiles').update({
                        full_name: formData.full_name,
                        role: formData.role,
                        proceso_id: formData.proceso_id || null
                    }).eq('id', item.id);
                    if (profileError) throw profileError;
                    if (formData.password && formData.password.trim() !== '') {
                        await supabaseAdmin.auth.admin.updateUserById(item.id, { password: formData.password });
                    } 
                } else {
                    // --- CAMBIO AQUI: Creación de usuario activado automáticamente ---
                    const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
                        email: formData.email,
                        password: formData.password || '123456',
                        email_confirm: true, // Auto-verificar correo
                        user_metadata: { role: formData.role, full_name: formData.full_name }
                    });
                    
                    if (createError) throw createError;
                    
                    if (data.user) {
                        const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
                            id: data.user.id,
                            email: formData.email,
                            full_name: formData.full_name,
                            role: formData.role,
                            proceso_id: formData.proceso_id || null
                        });
                        if (profileError) throw profileError;
                    }
                }
            }
            onSave();
            
            // --- CAMBIO AQUI: Alertas de éxito ---
            if (!isEdit) {
                alert(type === 'indicadores' ? "✅ Indicador creado exitosamente." : "✅ Usuario creado y activado exitosamente.");
            } else {
                alert("✅ Registro actualizado correctamente.");
            }
            
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">{isEdit ? 'Editar' : 'Nuevo'} {type === 'indicadores' ? 'Indicador' : 'Usuario'}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X size={18} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-5 text-left custom-scrollbar">
                    {type === 'indicadores' ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Código" value={formData.codigo_indicador} onChange={(v:any) => setFormData({...formData, codigo_indicador: v})} required />
                                <Select label="Unidad de Proceso" value={formData.proceso_id} onChange={(v:any) => setFormData({...formData, proceso_id: v})} options={procesos.map((p: any) => ({ label: p.nombre_proceso, value: p.id }))} />
                            </div>
                            
                            <Field label="Nombre del Indicador" value={formData.nombre_indicador} onChange={(v:any) => setFormData({...formData, nombre_indicador: v})} required />
                            
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descripción del Indicador</label>
                                <textarea 
                                    value={formData.descripcion} 
                                    onChange={e => setFormData({...formData, descripcion: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-200 min-h-[60px]"
                                    placeholder="Explique qué mide este indicador..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Select label="Tipo" value={formData.tipo_indicador} onChange={(v:any) => setFormData({...formData, tipo_indicador: v})} options={['Eficacia', 'Eficiencia', 'Efectividad', 'Cumplimiento']} />
                                <Select label="Estado" value={formData.estado} onChange={(v:any) => setFormData({...formData, estado: v})} options={['Activo', 'Inactivo']} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Fórmula de Cálculo" value={formData.formula_calculo} onChange={(v:any) => setFormData({...formData, formula_calculo: v})} placeholder="Ej: (A/B)*100" />
                                <Field label="Fuente de Datos" value={formData.fuente_informacion} onChange={(v:any) => setFormData({...formData, fuente_informacion: v})} placeholder="Ej: CRM, Excel, ERP" />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <Field label="Meta" type="number" value={formData.meta} onChange={(v:any) => setFormData({...formData, meta: v})} required />
                                <Select label="Unidad" value={formData.unidad_medida} onChange={(v:any) => setFormData({...formData, unidad_medida: v})} options={['Porcentaje (%)', 'Número', 'Pesos ($)', 'Días']} />
                                <Select label="Frecuencia" value={formData.frecuencia} onChange={(v:any) => setFormData({...formData, frecuencia: v})} options={['Mensual', 'Bimestral', 'Trimestral', 'Semestral', 'Anual']} />
                            </div>

                            {/* SECCIÓN DE SEMAFORIZACIÓN */}
                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                    <Activity size={16} className="text-slate-500" />
                                    <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-wider">Configuración de Semaforización (%)</h4>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-green-600 uppercase">🟢 Excelente (≥)</label>
                                        <input type="number" value={formData.umbral_verde} onChange={e => setFormData({...formData, umbral_verde: e.target.value})} className="w-full p-2 text-sm font-bold border rounded-lg focus:ring-2 focus:ring-green-100" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-amber-600 uppercase">🟡 Aceptable (≥)</label>
                                        <input type="number" value={formData.umbral_amarillo} onChange={e => setFormData({...formData, umbral_amarillo: e.target.value})} className="w-full p-2 text-sm font-bold border rounded-lg focus:ring-2 focus:ring-amber-100" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-red-600 uppercase">🔴 Crítico {'<'}</label>
                                        <div className="w-full p-2 text-sm font-bold bg-slate-100 border rounded-lg text-slate-400">
                                            {formData.umbral_amarillo || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-6">
                                <Field label="Email de Usuario" value={formData.email} onChange={(v:any) => setFormData({...formData, email: v})} required disabled={isEdit} />
                                <Field label={isEdit ? "Nueva Contraseña (Opcional)" : "Contraseña Temporal"} type="password" value={formData.password} onChange={(v:any) => setFormData({...formData, password: v})} required={!isEdit} placeholder={isEdit ? "Dejar en blanco" : "Mín. 6 caracteres"} />
                            </div>
                            <Field label="Nombre Completo" value={formData.full_name} onChange={(v:any) => setFormData({...formData, full_name: v})} required />
                            <div className="grid grid-cols-2 gap-6">
                                <Select label="Rol" value={formData.role} onChange={(v:any) => setFormData({...formData, role: v})} options={['Administrador', 'Líder de Proceso']} />
                                <Select label="Proceso Asignado" value={formData.proceso_id} onChange={(v:any) => setFormData({...formData, proceso_id: v})} options={procesos.map((p: any) => ({ label: p.nombre_proceso, value: p.id }))} />
                            </div>
                        </>
                    )}

                    <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white pb-2">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors uppercase">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-8 py-2.5 rounded-xl text-xs font-bold bg-[#b91c1c] text-white hover:bg-red-800 transition-all uppercase flex items-center gap-2 shadow-lg shadow-red-900/20">
                            {loading ? 'Guardando...' : <><Save size={16} /> Guardar Registro</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// UI HELPERS
const Field = ({ label, value, onChange, type="text", required=false, disabled=false, placeholder="" }: any) => (
    <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label} {required && '*'}</label>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} disabled={disabled} required={required} placeholder={placeholder} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-200 transition-all disabled:opacity-50" />
    </div>
);

const Select = ({ label, value, onChange, options }: any) => (
    <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
        <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-200 transition-all cursor-pointer">
            <option value="">Seleccionar...</option>
            {options.map((opt: any) => (
                <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                    {typeof opt === 'string' ? opt : opt.label}
                </option>
            ))}
        </select>
    </div>
);

export default AdminPanel;