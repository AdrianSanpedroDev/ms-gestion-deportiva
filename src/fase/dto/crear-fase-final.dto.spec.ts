import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ActualizarFaseFinalDto } from './actualizar-fase-final.dto';
import {
  CANTIDADES_EQUIPOS_FASE_FINAL,
  CrearFaseFinalDto,
  esCantidadEquiposValida,
} from './crear-fase-final.dto';

async function validar<T extends object>(
  Clase: new () => T,
  plano: Record<string, unknown>,
) {
  const dto = plainToInstance(Clase, plano);
  const errores = await validate(dto);
  return { dto, errores };
}

describe('DTOs de fase final (HU-GC-05)', () => {
  describe('esCantidadEquiposValida', () => {
    it('acepta 2, 4, 8, 16 y 32 y rechaza otros valores', () => {
      for (const cantidad of CANTIDADES_EQUIPOS_FASE_FINAL) {
        expect(esCantidadEquiposValida(cantidad)).toBe(true);
      }
      for (const invalida of [0, 1, 3, 6, 12, 24, 64]) {
        expect(esCantidadEquiposValida(invalida)).toBe(false);
      }
    });
  });

  describe('CrearFaseFinalDto y ActualizarFaseFinalDto', () => {
    it('acepta datos válidos, aplica trim al nombre y acepta tercerPuesto opcional', async () => {
      const conTercerPuesto = await validar(CrearFaseFinalDto, {
        nombre: '  Fase final  ',
        orden: 2,
        cantidadEquipos: 8,
        tercerPuesto: true,
      });
      const sinTercerPuesto = await validar(ActualizarFaseFinalDto, {
        nombre: 'Eliminatorias',
        orden: 3,
        cantidadEquipos: 4,
      });

      expect(conTercerPuesto.errores).toHaveLength(0);
      expect(conTercerPuesto.dto.nombre).toBe('Fase final');
      expect(conTercerPuesto.dto.tercerPuesto).toBe(true);

      expect(sinTercerPuesto.errores).toHaveLength(0);
      expect(sinTercerPuesto.dto.tercerPuesto).toBeUndefined();
    });

    it('rechaza nombre vacío o superior a 100 caracteres', async () => {
      const vacio = await validar(CrearFaseFinalDto, {
        nombre: '   ',
        orden: 2,
        cantidadEquipos: 4,
      });
      const largo = await validar(CrearFaseFinalDto, {
        nombre: 'F'.repeat(101),
        orden: 2,
        cantidadEquipos: 4,
      });

      expect(vacio.errores).toHaveLength(1);
      expect(vacio.errores[0].constraints?.isNotEmpty).toBe(
        'El nombre de la fase final es obligatorio',
      );

      expect(largo.errores).toHaveLength(1);
      expect(largo.errores[0].constraints?.maxLength).toBe(
        'El nombre de la fase final no puede superar los 100 caracteres',
      );
    });

    it('rechaza orden menor a 1 o no entero', async () => {
      const cero = await validar(CrearFaseFinalDto, {
        nombre: 'Fase final',
        orden: 0,
        cantidadEquipos: 4,
      });
      const decimal = await validar(CrearFaseFinalDto, {
        nombre: 'Fase final',
        orden: 1.5,
        cantidadEquipos: 4,
      });

      expect(cero.errores).toHaveLength(1);
      expect(cero.errores[0].constraints?.min).toBe(
        'El orden de la fase final debe ser mayor o igual a 1',
      );

      expect(decimal.errores).toHaveLength(1);
      expect(decimal.errores[0].constraints?.isInt).toBe(
        'El orden de la fase final debe ser un número entero',
      );
    });

    it('rechaza cantidadEquipos fuera de {2, 4, 8, 16, 32} o no entero', async () => {
      const seis = await validar(CrearFaseFinalDto, {
        nombre: 'Fase final',
        orden: 2,
        cantidadEquipos: 6,
      });
      const texto = await validar(CrearFaseFinalDto, {
        nombre: 'Fase final',
        orden: 2,
        cantidadEquipos: '8',
      });

      expect(seis.errores).toHaveLength(1);
      expect(seis.errores[0].constraints?.isIn).toBe(
        'La cantidad de equipos de la fase final debe ser 2, 4, 8, 16 o 32',
      );

      expect(texto.errores).toHaveLength(1);
      expect(texto.errores[0].constraints?.isInt).toBe(
        'La cantidad de equipos de la fase final debe ser un número entero',
      );
    });

    it('rechaza tercerPuesto que no sea booleano', async () => {
      const { errores } = await validar(CrearFaseFinalDto, {
        nombre: 'Fase final',
        orden: 2,
        cantidadEquipos: 4,
        tercerPuesto: 'true',
      });

      expect(errores).toHaveLength(1);
      expect(errores[0].constraints?.isBoolean).toBe(
        'El campo tercerPuesto debe ser un valor booleano',
      );
    });
  });
});
