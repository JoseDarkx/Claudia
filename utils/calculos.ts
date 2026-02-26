import { Semaforo } from '../types';

export const calcularCumplimiento = (resultado: number, meta: number, umbralVerde: number, umbralAmarillo: number) => {
  if (!meta || meta === 0) {
    // Caso especial: Meta Cero (ej. Cero Accidentes)
    return resultado === 0 ? 100 : 0;
  }

  const esInverso = umbralVerde < umbralAmarillo;

  if (esInverso) {
    // INDICADOR INVERSO (Menos es Mejor, ej. Rotación)
    if (resultado <= meta) return 100;
    const pct = (meta / resultado) * 100;
    return Math.max(0, Math.min(100, pct));
  } else {
    // INDICADOR DIRECTO (Más es Mejor, ej. Ventas)
    const pct = (resultado / meta) * 100;
    return Math.max(0, Math.min(100, pct));
  }
};

// LIMPIEZA: Se eliminaron las funciones obsoletas 'determinarSemaforo' y 'getHexSemaforo'
// que usaban umbrales fijos (80%/70%). Usar siempre las versiones dinámicas abajo.

export const determinarSemaforoDinamico = (
  resultado: number, 
  umbralVerde: number, 
  umbralAmarillo: number
): Semaforo => {
  const esInverso = umbralVerde < umbralAmarillo;

  if (esInverso) {
    // Menos es Mejor
    if (resultado <= umbralVerde) return 'Verde';
    if (resultado <= umbralAmarillo) return 'Amarillo';
    return 'Rojo';
  } else {
    // Más es Mejor
    if (resultado >= umbralVerde) return 'Verde';
    if (resultado >= umbralAmarillo) return 'Amarillo';
    return 'Rojo';
  }
};

export const getHexSemaforoDinamico = (resultado: number, umbralVerde: number, umbralAmarillo: number) => {
    const estado = determinarSemaforoDinamico(resultado, umbralVerde, umbralAmarillo);
    if (estado === 'Verde') return '#10b981';
    if (estado === 'Amarillo') return '#f59e0b';
    return '#b91c1c';
};

export const formatPercent = (val: number) => `${Math.round(val)}%`;