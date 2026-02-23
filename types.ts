
export type TipoProceso = 'Estratégico' | 'Misional' | 'Apoyo';
export type TipoIndicador = 'Eficiencia' | 'Eficacia' | 'Efectividad' | 'Cumplimiento';
export type EstadoIndicador = 'Activo' | 'Inactivo';
export type EstadoRegistro = 'Borrador' | 'Enviado' | 'Revisado';
export type Semaforo = 'Verde' | 'Amarillo' | 'Rojo';
export type Frecuencia = 'Mensual' | 'Bimestral' | 'Trimestral' | 'Semestral' | 'Anual';

export interface Proceso {
  id: string;
  codigo_proceso: string;
  nombre_proceso: string;
  tipo_proceso: TipoProceso;
  lider_id: string;
  created_at: string;
}

export interface Indicador {
  id: string;
  codigo_indicador: string;
  nombre_indicador: string;
  proceso_id: string;
  tipo_indicador: TipoIndicador;
  descripcion: string;
  formula_calculo: string;
  meta: number;
  unidad_medida: string;
  frecuencia: Frecuencia;
  fuente_informacion: string;
  estado: EstadoIndicador;
  umbral_verde: number;
  umbral_amarillo: number;
  umbral_rojo: number;
  created_at: string;
  procesos?: Proceso;
}

export interface RegistroMensual {
  id: string;
  indicador_id: string;
  proceso_id: string;
  periodo: string; 
  resultado_mensual: number;
  meta: number;
  unidad_medida: string;
  cumple_meta: boolean;
  porcentaje_cumplimiento: number;
  semaforo: Semaforo;
  observaciones: string;
  accion_mejora: string;
  usuario_sistema: string;
  nombre_responsable_registro: string;
  fecha_registro: string;
  estado_registro: EstadoRegistro;
  indicadores?: Indicador;
  procesos?: Proceso;
}

export type UserRole = 'Administrador' | 'Líder de Proceso';

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  role: UserRole;
  proceso_id?: string;
  status?: 'Activo' | 'Inactivo';
  procesos?: Proceso;
}
