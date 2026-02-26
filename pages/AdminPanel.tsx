import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Proceso, UserProfile, Indicador } from '../types';
import { Settings, Users, Activity, Plus, Edit2, Trash2, Filter, X, Save, AlertCircle } from 'lucide-react';

// FIX SEGURIDAD: Se eliminó el import de createClient y las referencias a supabaseUrl/serviceRoleKey.
// Todas las operaciones de admin ahora van a través de Edge Functions seguras.

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
        console.log("🚀 [AdminPanel] Iniciando carga de datos...");
        try {
            const [iRes, uRes, pRes] = await Promise.all([
                supabase.from('indicadores').select('id, codigo_indicador, nombre_indicador, tipo_indicador, estado, descripcion, meta, unidad_medida, frecuencia, procesos(id, nombre_proceso)').order('codigo_indicador'),
                supabase.from('profiles').select('id, full_name, role, email, proceso_id, procesos(id, nombre_proceso)').order('full_name'),
                supabase.from('procesos').select('id, nombre_proceso, codigo_proceso').order('codigo_proceso')
            ]);

            console.log("📊 [AdminPanel] Respuesta Indicadores:", iRes.data?.length || 0, "registros", iRes.error ? "❌ ERROR" : "✅");
            if (iRes.error) console.error("❌ Detalle Error Indicadores:", iRes.error);

            console.log("👥 [AdminPanel] Respuesta Usuarios:", uRes.data?.length || 0, "registros", uRes.error ? "❌ ERROR" : "✅");
            if (uRes.error) console.error("❌ Detalle Error Usuarios:", uRes.error);

            console.log("⚙️ [AdminPanel] Respuesta Procesos:", pRes.data?.length || 0, "registros", pRes.error ? "❌ ERROR" : "✅");
            if (pRes.error) console.error("❌ Detalle Error Procesos:", pRes.error);

            setIndicadores((iRes.data as any[]) || []);
            setUsuarios((uRes.data as any[]) || []);
            setProcesos((pRes.data as any[]) || []);
        } catch (e) {
            console.error("🔥 [AdminPanel] Error Crítico en fetchData:", e);
        } finally {
            console.log("🏁 [AdminPanel] Carga finalizada.");
            setLoading(false);
        }
    };

    // FIX SEGURIDAD: handleDelete ahora usa la Edge Function 'eliminar-usuario'
    // en lugar de crear un adminClient en el navegador.
    const handleDelete = async (id: string, table: string) => {
        if (!confirm('¿Está seguro de eliminar este registro permanentemente?')) return;

        try {
            if (table === 'profiles') {
                const { data, error } = await supabase.functions.invoke('eliminar-usuario', {
                    body: { userId: id }
                });
                if (error) {
                    console.error("❌ Error invocando eliminar-usuario:", error);
                    let detail = error.message;
                    if (error.name === 'FunctionsHttpError') {
                        try {
                            const response = (error as any).context;
                            if (response) {
                                const body = await response.json();
                                detail = body.error || body.message || JSON.stringify(body);
                            }
                        } catch (e) {
                            console.warn("No se pudo parsear el error de la función:", e);
                        }
                    }
                    throw new Error(`Error de la función: ${detail}`);
                }
                if (data?.error) throw new Error(data.error);
            } else {
                const { error } = await supabase.from(table).delete().eq('id', id);
                if (error) throw error;
            }
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
                                        <p className="text-xs text-slate-500 font-medium">
                                            {u.email} • {u.role === 'Administrador'
                                                ? 'Sistema de Gestión / Acceso Global'
                                                : `Líder de ${u.procesos?.nombre_proceso || procesos.find(p => p.id === u.proceso_id)?.nombre_proceso || 'proceso pendiente'}`}
                                        </p>
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
                                        {/* FIX: Badge de estado dinámico según el valor real */}
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
                // FIX: Se usaba 'Eficacia' como default pero la lista incluía 'Efectividad' (no existe en types.ts)
                tipo_indicador: item?.tipo_indicador || 'Eficacia',
                descripcion: item?.descripcion || '',
                formula_calculo: item?.formula_calculo || '',
                meta: item?.meta || 0,
                unidad_medida: item?.unidad_medida || 'Porcentaje (%)',
                frecuencia: item?.frecuencia || 'Mensual',
                fuente_informacion: item?.fuente_informacion || '',
                umbral_verde: item?.umbral_verde || 80,
                umbral_amarillo: item?.umbral_amarillo || 70,
                umbral_rojo: item?.umbral_rojo || 0,
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
        console.log("Iniciando guardado...", { type, isEdit, formData });

        try {
            if (type === 'indicadores') {
                const payload = {
                    ...formData,
                    meta: Number(formData.meta),
                    umbral_verde: Number(formData.umbral_verde),
                    umbral_amarillo: Number(formData.umbral_amarillo),
                    umbral_rojo: Number(formData.umbral_rojo),
                    proceso_id: formData.proceso_id === "" ? null : formData.proceso_id
                };
                console.log("Payload de indicadores:", payload);

                if (isEdit) {
                    console.log("Ejecutando update en indicadores...");
                    const { error } = await supabase.from('indicadores').update(payload).eq('id', item.id);
                    if (error) {
                        console.error("Error en update indicadores:", error);
                        throw error;
                    }
                    console.log("Update indicadores exitoso");
                } else {
                    console.log("Ejecutando insert en indicadores...");
                    const { error } = await supabase.from('indicadores').insert([payload]);
                    if (error) {
                        console.error("Error en insert indicadores:", error);
                        throw error;
                    }
                    console.log("Insert indicadores exitoso");
                }
            } else {
                if (isEdit) {
                    // FIX SEGURIDAD: Ahora usa la Edge Function 'editar-usuario'
                    // en lugar de crear un adminClient con SERVICE_ROLE_KEY
                    console.log("Invocando editar-usuario con datos:", { userId: item.id, ...formData });
                    const { data, error: functionError } = await supabase.functions.invoke('editar-usuario', {
                        body: {
                            userId: item.id,
                            full_name: formData.full_name,
                            role: formData.role,
                            proceso_id: formData.proceso_id || null,
                            password: formData.password && formData.password.trim() !== '' ? formData.password : undefined
                        }
                    });

                    if (functionError) {
                        console.error("❌ Error invocando editar-usuario:", functionError);
                        let detail = functionError.message;
                        if (functionError.name === 'FunctionsHttpError') {
                            try {
                                const response = (functionError as any).context;
                                if (response) {
                                    const body = await response.json();
                                    detail = body.error || body.message || JSON.stringify(body);
                                }
                            } catch (e) {
                                console.warn("No se pudo parsear el error de la función:", e);
                            }
                        }
                        throw new Error(`Error de la función: ${detail}`);
                    }
                    if (data?.error) {
                        console.error("❌ Error lógico en editar-usuario:", data.error);
                        throw new Error(`Error de servidor: ${data.error}`);
                    }
                    console.log("✅ editar-usuario exitoso:", data);
                } else {
                    console.log("Invocando crear-usuario con datos:", formData);
                    const { data, error: functionError } = await supabase.functions.invoke('crear-usuario', {
                        body: {
                            email: formData.email,
                            password: formData.password || '123456',
                            full_name: formData.full_name,
                            role: formData.role,
                            proceso_id: formData.proceso_id || null,
                            nombre_proceso: procesos.find((p: any) => p.id === formData.proceso_id)?.nombre_proceso || ''
                        }
                    });

                    if (functionError) {
                        console.error("❌ Error invocando crear-usuario:", functionError);

                        // FIX: Los errores de Edge Functions en supabase-js incluyen detalles
                        // Intentamos extraer el mensaje de error lógico enviado por la función
                        let detail = functionError.message;
                        if (functionError.name === 'FunctionsHttpError') {
                            try {
                                const response = (functionError as any).context;
                                if (response) {
                                    const body = await response.json();
                                    detail = body.error || body.message || JSON.stringify(body);
                                }
                            } catch (e) {
                                console.warn("No se pudo parsear el error de la función:", e);
                            }
                        }
                        throw new Error(`Error de la función: ${detail}`);
                    }
                    if (data?.error) {
                        console.error("❌ Error lógico en crear-usuario:", data.error);
                        throw new Error(`Error de servidor: ${data.error}`);
                    }
                    console.log("✅ crear-usuario exitoso:", data);
                }
            }
            console.log("Llamando a onSave...");
            onSave();

            if (!isEdit) {
                alert(type === 'indicadores' ? "✅ Indicador creado exitosamente." : "✅ Usuario creado. Se ha enviado un correo de bienvenida.");
            } else {
                alert("✅ Registro actualizado correctamente.");
            }

        } catch (err: any) {
            console.error("Excepción capturada en handleSubmit:", err);
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
            console.log("Operación finalizada.");
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
                                <Field label="Código" value={formData.codigo_indicador} onChange={(v: any) => setFormData({ ...formData, codigo_indicador: v })} required />
                                <Select label="Unidad de Proceso" value={formData.proceso_id} onChange={(v: any) => setFormData({ ...formData, proceso_id: v })} options={procesos.map((p: any) => ({ label: p.nombre_proceso, value: p.id }))} />
                            </div>

                            <Field label="Nombre del Indicador" value={formData.nombre_indicador} onChange={(v: any) => setFormData({ ...formData, nombre_indicador: v })} required />

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descripción del Indicador</label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-200 min-h-[60px]"
                                    placeholder="Explique qué mide este indicador..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Se restauró 'Efectividad' como tipo de indicador por solicitud del usuario */}
                                <Select label="Tipo" value={formData.tipo_indicador} onChange={(v: any) => setFormData({ ...formData, tipo_indicador: v })} options={['Eficacia', 'Eficiencia', 'Efectividad', 'Cumplimiento']} />
                                <Select label="Estado" value={formData.estado} onChange={(v: any) => setFormData({ ...formData, estado: v })} options={['Activo', 'Inactivo']} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Fórmula de Cálculo" value={formData.formula_calculo} onChange={(v: any) => setFormData({ ...formData, formula_calculo: v })} placeholder="Ej: (A/B)*100" />
                                <Field label="Fuente de Datos" value={formData.fuente_informacion} onChange={(v: any) => setFormData({ ...formData, fuente_informacion: v })} placeholder="Ej: CRM, Excel, ERP" />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <Field label="Meta" type="number" value={formData.meta} onChange={(v: any) => setFormData({ ...formData, meta: v })} required />
                                <Select label="Unidad" value={formData.unidad_medida} onChange={(v: any) => setFormData({ ...formData, unidad_medida: v })} options={['Porcentaje (%)', 'Número', 'Pesos ($)', 'Días']} />
                                <Select label="Frecuencia" value={formData.frecuencia} onChange={(v: any) => setFormData({ ...formData, frecuencia: v })} options={['Mensual', 'Bimestral', 'Trimestral', 'Semestral', 'Anual']} />
                            </div>

                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                    <Activity size={16} className="text-slate-500" />
                                    <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-wider">Configuración de Semaforización (%)</h4>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-green-600 uppercase">🟢 Excelente (≥)</label>
                                        <input type="number" value={formData.umbral_verde} onChange={e => setFormData({ ...formData, umbral_verde: e.target.value })} className="w-full p-2 text-sm font-bold border rounded-lg focus:ring-2 focus:ring-green-100" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-amber-600 uppercase">🟡 Aceptable (≥)</label>
                                        <input type="number" value={formData.umbral_amarillo} onChange={e => setFormData({ ...formData, umbral_amarillo: e.target.value })} className="w-full p-2 text-sm font-bold border rounded-lg focus:ring-2 focus:ring-amber-100" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-red-600 uppercase">🔴 Crítico {'<'}</label>
                                        <input type="number" value={formData.umbral_rojo} onChange={e => setFormData({ ...formData, umbral_rojo: e.target.value })} className="w-full p-2 text-sm font-bold border rounded-lg focus:ring-2 focus:ring-red-100" />
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-6">
                                <Field label="Email de Usuario" value={formData.email} onChange={(v: any) => setFormData({ ...formData, email: v })} required disabled={isEdit} />
                                <Field label={isEdit ? "Nueva Contraseña (Opcional)" : "Contraseña Temporal"} type="password" value={formData.password} onChange={(v: any) => setFormData({ ...formData, password: v })} required={!isEdit} placeholder={isEdit ? "Dejar en blanco" : "Mín. 6 caracteres"} />
                            </div>
                            <Field label="Nombre Completo" value={formData.full_name} onChange={(v: any) => setFormData({ ...formData, full_name: v })} required />
                            <div className="grid grid-cols-2 gap-6">
                                <Select label="Rol" value={formData.role} onChange={(v: any) => setFormData({ ...formData, role: v })} options={['Administrador', 'Líder de Proceso']} />
                                <Select label="Proceso Asignado" value={formData.proceso_id} onChange={(v: any) => setFormData({ ...formData, proceso_id: v })} options={procesos.map((p: any) => ({ label: p.nombre_proceso, value: p.id }))} />
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
const Field = ({ label, value, onChange, type = "text", required = false, disabled = false, placeholder = "" }: any) => (
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