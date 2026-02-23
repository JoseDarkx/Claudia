import { Semaforo } from '../types';

export const calcularCumplimiento = (resultado: number, meta: number) => {
  if (!meta || meta === 0) return 0;
  return (resultado / meta) * 100;
};

// LIMPIEZA: Se eliminaron las funciones obsoletas 'determinarSemaforo' y 'getHexSemaforo'
// que usaban umbrales fijos (80%/70%). Usar siempre las versiones dinámicas abajo.

export const determinarSemaforoDinamico = (
  porcentaje: number, 
  umbralVerde: number, 
  umbralAmarillo: number,
  umbralRojo: number = 0 
): Semaforo => {
  if (porcentaje >= umbralVerde) return 'Verde';
  if (porcentaje >= umbralAmarillo) return 'Amarillo';
  return 'Rojo';
};

export const getHexSemaforoDinamico = (porcentaje: number, umbralVerde: number, umbralAmarillo: number) => {
    if (porcentaje >= umbralVerde) return '#10b981'; 
    if (porcentaje >= umbralAmarillo) return '#f59e0b'; 
    return '#b91c1c'; 
};

export const formatPercent = (val: number) => `${Math.round(val)}%`;