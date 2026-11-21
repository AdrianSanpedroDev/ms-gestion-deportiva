import { escaparLike } from './consultas';

// escaparLike: para que buscar "_" o "%" encuentre ese carácter y no actúe como comodín de LIKE.
describe('escaparLike', () => {
  it('escapa % con una barra invertida delante', () => {
    expect(escaparLike('50%')).toBe('50\\%');
  });

  it('escapa _ con una barra invertida delante', () => {
    expect(escaparLike('a_b')).toBe('a\\_b');
  });

  it('escapa la propia barra invertida (se duplica)', () => {
    expect(escaparLike('a\\b')).toBe('a\\\\b');
  });

  it('escapa todas las apariciones, no solo la primera', () => {
    expect(escaparLike('%_%_')).toBe('\\%\\_\\%\\_');
  });

  it('escapa los tres caracteres especiales juntos', () => {
    expect(escaparLike('100%_\\')).toBe('100\\%\\_\\\\');
  });

  it('un texto normal queda igual', () => {
    expect(escaparLike('Juan Pérez')).toBe('Juan Pérez');
  });

  it('no toca comillas, tildes ni números', () => {
    expect(escaparLike("O'Brien ñandú 123")).toBe("O'Brien ñandú 123");
  });

  it('texto vacío queda vacío', () => {
    expect(escaparLike('')).toBe('');
  });
});
