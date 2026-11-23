export function aFechaHoraIso(valor: Date | string): string {
  if (typeof valor === 'string') return valor.replace(' ', 'T').substring(0, 19);
  const year = valor.getFullYear();
  const month = String(valor.getMonth() + 1).padStart(2, '0');
  const day = String(valor.getDate()).padStart(2, '0');
  const hour = String(valor.getHours()).padStart(2, '0');
  const minute = String(valor.getMinutes()).padStart(2, '0');
  const second = String(valor.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

export function hoyBogota(): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const valor = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return `${valor.year}-${valor.month}-${valor.day}`;
}
