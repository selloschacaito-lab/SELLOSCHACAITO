// Utilidades para evitar clientes duplicados por RIF/Cédula.
// El formato en que se captura el RIF varía entre pantallas y con los años
// (con o sin guiones/puntos, con o sin la letra inicial), así que la
// comparación se hace siempre sobre una versión "normalizada" — sin
// caracteres que no sean letras o números, en mayúsculas.

/**
 * Normaliza un RIF/Cédula para comparación (quita guiones, puntos, espacios
 * y pone todo en mayúsculas). Ej: "V-12.783.182" y "V12783182" normalizan
 * al mismo valor.
 */
export function normalizeRif(rif) {
  return (rif || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Busca, dentro de una lista de clientes ya cargada en memoria, si alguno
 * tiene el mismo RIF (normalizado) que el indicado. No hace ninguna
 * consulta a la base de datos — se apoya en una lista que la pantalla ya
 * tenga cargada (ej. `allClients` en POSModal/NewOrderModal).
 *
 * @param {Array<{id:string, rif?:string, cedula?:string}>} clientsList
 * @param {string} rif
 * @param {string|null} excludeId Id a ignorar (ej. el cliente que ya se está editando)
 * @returns {object|null} El cliente encontrado, o null si no hay coincidencia
 */
export function findClientByNormalizedRif(clientsList, rif, excludeId = null) {
  const target = normalizeRif(rif);
  if (!target) return null;
  return (clientsList || []).find(c =>
    c.id !== excludeId && normalizeRif(c.rif || c.cedula) === target
  ) || null;
}
