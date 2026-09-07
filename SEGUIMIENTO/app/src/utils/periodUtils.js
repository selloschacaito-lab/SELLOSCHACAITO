// Utilidades de período compartidas por la página de Estadísticas: calcula el
// rango de fechas del período actual y el anterior (para comparar), y compara
// dos valores numéricos (actual vs. anterior) en una sola función reutilizable.

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export const PERIOD_OPTIONS = [
  { key: 'dia', label: 'Día' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
  { key: 'anio', label: 'Año' },
  { key: 'todo', label: 'Todo' }
];

/**
 * Calcula el inicio/fin del período actual y del período anterior (para comparar).
 * 'todo' no tiene período anterior (no aplica comparación).
 */
export function getPeriodBounds(periodKey, referenceDate = new Date()) {
  const ref = new Date(referenceDate);

  if (periodKey === 'dia') {
    const currentStart = startOfDay(ref);
    const currentEnd = endOfDay(ref);
    const prevDay = new Date(ref);
    prevDay.setDate(prevDay.getDate() - 1);
    return {
      currentStart, currentEnd,
      previousStart: startOfDay(prevDay), previousEnd: endOfDay(prevDay),
      label: 'Hoy'
    };
  }

  if (periodKey === 'semana') {
    const day = ref.getDay(); // 0=domingo..6=sábado
    const diffToMonday = (day === 0 ? -6 : 1 - day);
    const monday = new Date(ref);
    monday.setDate(ref.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const prevMonday = new Date(monday);
    prevMonday.setDate(monday.getDate() - 7);
    const prevSunday = new Date(prevMonday);
    prevSunday.setDate(prevMonday.getDate() + 6);
    return {
      currentStart: startOfDay(monday), currentEnd: endOfDay(sunday),
      previousStart: startOfDay(prevMonday), previousEnd: endOfDay(prevSunday),
      label: 'Esta Semana'
    };
  }

  if (periodKey === 'mes') {
    const currentStart = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
    const currentEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
    const previousStart = new Date(ref.getFullYear(), ref.getMonth() - 1, 1, 0, 0, 0, 0);
    const previousEnd = new Date(ref.getFullYear(), ref.getMonth(), 0, 23, 59, 59, 999);
    return { currentStart, currentEnd, previousStart, previousEnd, label: 'Este Mes' };
  }

  if (periodKey === 'anio') {
    const currentStart = new Date(ref.getFullYear(), 0, 1, 0, 0, 0, 0);
    const currentEnd = new Date(ref.getFullYear(), 11, 31, 23, 59, 59, 999);
    const previousStart = new Date(ref.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
    const previousEnd = new Date(ref.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    return { currentStart, currentEnd, previousStart, previousEnd, label: 'Este Año' };
  }

  // 'todo': sin período anterior que comparar
  return {
    currentStart: new Date(2000, 0, 1),
    currentEnd: endOfDay(ref),
    previousStart: null,
    previousEnd: null,
    label: 'Todo el Historial'
  };
}

/** ¿La fecha cae dentro de [start, end]? (ambos inclusive, cualquiera puede ser null = sin límite) */
export function isWithin(dateVal, start, end) {
  if (!dateVal) return false;
  const t = new Date(dateVal).getTime();
  if (isNaN(t)) return false;
  if (start && t < start.getTime()) return false;
  if (end && t > end.getTime()) return false;
  return true;
}

/**
 * Compara un valor actual contra el anterior: diferencia, % de cambio y dirección.
 * Si no hay período anterior (ej. "todo"), pctChange/direction quedan en null.
 */
export function compareMetric(current, previous) {
  const cur = Number(current) || 0;
  if (previous === null || previous === undefined) {
    return { value: cur, previous: null, delta: null, pctChange: null, direction: null };
  }
  const prev = Number(previous) || 0;
  const delta = cur - prev;
  let pctChange;
  if (prev !== 0) pctChange = (delta / Math.abs(prev)) * 100;
  else pctChange = cur !== 0 ? 100 : 0;
  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  return { value: cur, previous: prev, delta, pctChange, direction };
}
