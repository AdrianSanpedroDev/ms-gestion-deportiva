// Helpers de fechas de B. Están en utils/ (no en mappers/) porque no traducen entidad ↔ DTO:
// uno DA la fecha de hoy y el otro DA FORMATO a una fecha. Reflejan el common/utils de ACUERDOS 4.1.
// TODO: reemplazar por hoyBogota() y aFechaHoraIso() de common/utils cuando A los suba
// (avisar a A de que aFechaHoraIso debe aceptar Date, ver abajo).

// "Hoy" en Bogotá como texto "yyyy-MM-dd" (ej. "2026-11-20"). El formato canadiense (en-CA) es justo yyyy-MM-dd.
// Se usa la zona de Bogotá y no la del servidor: a las 21:00 en Bogotá ya es el día siguiente en UTC.
export function hoyBogota(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
}

// Convierte una columna DATETIME al formato del contrato: "2026-11-20T10:00:00" (ACUERDOS 5.5).
// OJO: en TypeORM 1.1.2 las columnas "datetime" llegan como Date AUNQUE dateStrings sea true
// (MysqlDriver.prepareHydratedValue hace new Date(texto) con la hora LOCAL del servidor).
// Por eso se leen los getters LOCALES (getHours, no getUTCHours): deshacen exactamente ese new Date
// y devuelven la misma hora que está guardada en MySQL. Las columnas "date" sí llegan como texto.
export function aFechaHoraIso(valor: Date | string): string {
  // Texto "2026-11-20 10:00:00" (o con microsegundos): se cambia el espacio por "T" y se corta en los segundos.
  if (typeof valor === 'string') {
    return valor.replace(' ', 'T').slice(0, 19);
  }

  const anio = valor.getFullYear();
  const mes = String(valor.getMonth() + 1).padStart(2, '0'); // getMonth() va de 0 a 11
  const dia = String(valor.getDate()).padStart(2, '0');
  const horas = String(valor.getHours()).padStart(2, '0');
  const minutos = String(valor.getMinutes()).padStart(2, '0');
  const segundos = String(valor.getSeconds()).padStart(2, '0');
  return `${anio}-${mes}-${dia}T${horas}:${minutos}:${segundos}`;
}
