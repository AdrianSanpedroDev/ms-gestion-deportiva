// Transformaciones de entrada que se aplican con @Transform ANTES de validar (ValidationPipe con transform: true).
// TODO: si A agrega un helper de trim compartido en common/utils, usar ese y borrar este archivo.

type Entrada = { value: unknown };

// ---------- Body (POST / PUT / PATCH) ----------

// Campos obligatorios: quita espacios a los lados ("  Juan " → "Juan"; "   " → "" y @IsNotEmpty lo rechaza).
export const recortar = ({ value }: Entrada) =>
  typeof value === 'string' ? value.trim() : value;

// Campos opcionales: igual, pero el texto vacío se vuelve null ("sin dato"), así @IsOptional lo deja pasar
// y en la BD queda NULL en vez de una cadena vacía.
export const recortarOpcional = ({ value }: Entrada) => {
  if (typeof value !== 'string') return value;
  const limpio = value.trim();
  return limpio === '' ? null : limpio;
};

// ---------- Filtros de la URL (query string) ----------
// Criterio único: en un filtro, "vacío" (?x=) significa SIEMPRE undefined = "sin filtro". Nunca null.
// En TypeORM 1.1.2 una clave del "where" con null O undefined lanza error (invalidWhereValuesBehavior = "throw"),
// así que el service solo agrega la clave si el filtro vino: if (filtros.x) / if (filtros.x !== undefined).
// Con null, "!== undefined" lo dejaría pasar y reventaría; con undefined, los dos "if" funcionan.

// Texto: "  Grupo " → "Grupo"; "" o "   " → undefined (sin filtro).
export const aTextoFiltro = ({ value }: Entrada) => {
  if (typeof value !== 'string') return value;
  const limpio = value.trim();
  return limpio === '' ? undefined : limpio;
};

// Booleano: en la URL todo llega como texto. "true" → true, "false" → false, "" → undefined (sin filtro).
// Cualquier otro valor ("si", "1") se deja igual para que @IsBoolean lo rechace con 400.
export const aBooleanoOpcional = ({ value }: Entrada) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === '') return undefined;
  return value;
};

// Entero: "5" → 5; "" → undefined (sin filtro).
// Solo se convierte si el texto son dígitos (con un "-" opcional): así "1e2" o "0x10" NO se vuelven 100 o 16
// (Number() sí los convertiría). Esos textos se dejan como texto y @IsInt los rechaza con 400.
// El "-" se deja pasar para que "-3" llegue como número y responda @Min ("debe ser mayor o igual a 1").
export const aEnteroOpcional = ({ value }: Entrada) => {
  if (typeof value !== 'string') return value;
  const limpio = value.trim();
  if (limpio === '') return undefined;
  if (!/^-?\d+$/.test(limpio)) return limpio;
  return Number(limpio);
};
