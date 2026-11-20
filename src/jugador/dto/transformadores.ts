// Transformaciones de entrada que se aplican con @Transform ANTES de validar (ValidationPipe con transform: true).
// TODO: si A agrega un helper de trim compartido en common/utils, usar ese y borrar este archivo.

type Entrada = { value: unknown };

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
