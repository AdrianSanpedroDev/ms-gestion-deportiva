import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ActualizarGrupoDto } from './actualizar-grupo.dto';
import { AsignarEquiposGrupoDto } from './asignar-equipos-grupo.dto';
import { CrearGrupoDto } from './crear-grupo.dto';
import { FiltrosGrupoDto } from './filtros-grupo.dto';

async function validar<T extends object>(
  Clase: new () => T,
  plano: Record<string, unknown>,
) {
  const dto = plainToInstance(Clase, plano);
  const errores = await validate(dto);
  return { dto, errores };
}

describe('DTOs de grupos (HU-GC-04)', () => {
  describe('CrearGrupoDto y ActualizarGrupoDto', () => {
    it('acepta nombre y orden válidos y aplica trim al nombre', async () => {
      const { dto, errores } = await validar(CrearGrupoDto, {
        nombre: '  Grupo A  ',
        orden: 1,
      });

      expect(errores).toHaveLength(0);
      expect(dto.nombre).toBe('Grupo A');
      expect(dto.orden).toBe(1);
    });

    it('rechaza nombre vacío, ausente o mayor a 100 caracteres', async () => {
      const vacio = await validar(CrearGrupoDto, { nombre: '   ', orden: 1 });
      const largo = await validar(CrearGrupoDto, {
        nombre: 'G'.repeat(101),
        orden: 1,
      });

      expect(vacio.errores).toHaveLength(1);
      expect(vacio.errores[0].constraints?.isNotEmpty).toBe(
        'El nombre del grupo es obligatorio',
      );
      expect(largo.errores).toHaveLength(1);
      expect(largo.errores[0].constraints?.maxLength).toBeDefined();
    });

    it('rechaza orden menor a 1 o no entero', async () => {
      const cero = await validar(ActualizarGrupoDto, {
        nombre: 'Grupo A',
        orden: 0,
      });
      const decimal = await validar(ActualizarGrupoDto, {
        nombre: 'Grupo A',
        orden: 1.5,
      });

      expect(cero.errores).toHaveLength(1);
      expect(cero.errores[0].constraints?.min).toBe(
        'El orden del grupo debe ser mayor o igual a 1',
      );
      expect(decimal.errores).toHaveLength(1);
      expect(decimal.errores[0].constraints?.isInt).toBe(
        'El orden del grupo debe ser un número entero',
      );
    });
  });

  describe('FiltrosGrupoDto', () => {
    it('permite omitir orden, enviarlo vacío o como texto numérico positivo', async () => {
      const sinFiltro = await validar(FiltrosGrupoDto, {});
      const vacio = await validar(FiltrosGrupoDto, { orden: '' });
      const conFiltro = await validar(FiltrosGrupoDto, { orden: '2' });

      expect(sinFiltro.errores).toHaveLength(0);
      expect(vacio.errores).toHaveLength(0);
      expect(vacio.dto.orden).toBeUndefined();
      expect(conFiltro.errores).toHaveLength(0);
      expect(conFiltro.dto.orden).toBe(2);
    });

    it('rechaza orden inválido en query string', async () => {
      const { errores } = await validar(FiltrosGrupoDto, { orden: '0' });

      expect(errores).toHaveLength(1);
      expect(errores[0].property).toBe('orden');
    });
  });

  describe('AsignarEquiposGrupoDto', () => {
    it('acepta arreglo de enteros positivos únicos', async () => {
      const { dto, errores } = await validar(AsignarEquiposGrupoDto, {
        equipoIds: [4, 9, 11],
      });

      expect(errores).toHaveLength(0);
      expect(dto.equipoIds).toEqual([4, 9, 11]);
    });

    it('rechaza arreglo vacío, duplicados o ids inválidos', async () => {
      const vacio = await validar(AsignarEquiposGrupoDto, { equipoIds: [] });
      const duplicados = await validar(AsignarEquiposGrupoDto, {
        equipoIds: [4, 4],
      });
      const negativos = await validar(AsignarEquiposGrupoDto, {
        equipoIds: [4, 0],
      });

      expect(vacio.errores).toHaveLength(1);
      expect(vacio.errores[0].constraints?.arrayNotEmpty).toBeDefined();
      expect(duplicados.errores).toHaveLength(1);
      expect(duplicados.errores[0].constraints?.arrayUnique).toBeDefined();
      expect(negativos.errores).toHaveLength(1);
      expect(negativos.errores[0].constraints?.min).toBeDefined();
    });
  });
});
