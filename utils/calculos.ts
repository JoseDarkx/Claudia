import { Semaforo } from '../types';

export const calcularCumplimiento = (resultado: number, meta: number) => {
  if (!meta || meta === 0) return 0;
  return (resultado / meta) * 100;
};

export const determinarSemaforo = (porcentaje: number): Semaforo => {
  if (porcentaje >= 80) return 'Verde';
  if (porcentaje >= 70) return 'Amarillo';
  return 'Rojo';
};

// Determina el semáforo basado en umbrales específicos del indicador
export const determinarSemaforoDinamico = (porcentaje: number, umbralVerde: number, umbralAmarillo: number): Semaforo => {
  if (porcentaje >= umbralVerde) return 'Verde';
  if (porcentaje >= umbralAmarillo) return 'Amarillo';
  return 'Rojo';
};

export const getHexSemaforo = (porcentaje: number) => {
    if (porcentaje >= 80) return '#10b981'; // Emerald 500 (Verde)
    if (porcentaje >= 70) return '#f59e0b'; // Amber 500 (Amarillo)
    return '#b91c1c'; // Red 700 (Rojo Corporativo)
};

export const formatPercent = (val: number) => `${Math.round(val)}%`;
