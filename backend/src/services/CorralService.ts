import { ICorral, ICorralBase } from '../interfaces';
import { Corral, Lote, Cerdo } from '../models';
import { Op } from 'sequelize';

/**
 * Servicio para la gestión de Corrales
 * Maneja toda la lógica de negocio relacionada con los corrales
 */
export class CorralService {
  /**
   * Crea un nuevo corral
   * @param data Datos del nuevo corral
   */
  async crearCorral(data: ICorralBase): Promise<ICorral> {
    try {
      // Validar que el lote existe
      const lote = await Lote.findByPk(data.lote_id);
      if (!lote) {
        throw new Error('El lote especificado no existe');
      }

      // Validar que el número de corral no esté duplicado
      const corralExistente = await Corral.findOne({
        where: { numero: data.numero }
      });
      if (corralExistente) {
        throw new Error('Ya existe un corral con este número');
      }

      // Validar que la capacidad sea mayor que 0
      if (data.capacidad <= 0) {
        throw new Error('La capacidad del corral debe ser mayor que 0');
      }

      // Validar que el tipo de corral coincida con el sitio del lote
      if (data.tipo === 'LECHON' && lote.sitio !== 'LECHON') {
        throw new Error('El tipo de corral no coincide con el sitio del lote');
      }

      const corral = await Corral.create({
        ...data,
        ocupacion_actual: 0,
        peso_promedio_actual: 0
      });

      // Cargar las relaciones después de crear
      await corral.reload({
        include: [
          { model: Lote, as: 'lote' }
        ]
      });

      return corral.toJSON() as ICorral;
    } catch (error) {
      console.error('Error en crearCorral:', error);
      throw new Error(`Error al crear el corral: ${(error as Error).message}`);
    }
  }

  /**
   * Obtiene todos los corrales con sus relaciones
   * @param filtros Opcional: filtros para la búsqueda
   */
  async obtenerCorrales(filtros?: Partial<ICorralBase>): Promise<ICorral[]> {
    try {
      const corrales = await Corral.findAll({
        where: filtros,
        include: [
          { 
            model: Lote, 
            as: 'lote' 
          },
          { 
            model: Cerdo, 
            as: 'cerdos_corral',
            attributes: ['id', 'arete', 'peso_actual', 'estado']
          }
        ],
        order: [['numero', 'ASC']]
      });
      return corrales.map(corral => corral.toJSON() as ICorral);
    } catch (error) {
      console.error('Error en obtenerCorrales:', error);
      throw new Error('Error al obtener los corrales');
    }
  }

  /**
   * Obtiene un corral específico por su ID
   * @param id ID del corral
   */
  async obtenerCorralPorId(id: string): Promise<ICorral | null> {
    try {
      const corral = await Corral.findByPk(id, {
        include: [
          { 
            model: Lote, 
            as: 'lote' 
          },
          { 
            model: Cerdo, 
            as: 'cerdos_corral',
            attributes: ['id', 'arete', 'peso_actual', 'estado', 'fecha_ingreso']
          }
        ]
      });
      return corral ? (corral.toJSON() as ICorral) : null;
    } catch (error) {
      console.error('Error en obtenerCorralPorId:', error);
      throw new Error('Error al obtener el corral');
    }
  }

  /**
   * Actualiza un corral existente
   * @param id ID del corral
   * @param data Datos a actualizar
   */
  async actualizarCorral(id: string, data: Partial<ICorralBase>): Promise<ICorral | null> {
    try {
      const corral = await Corral.findByPk(id);
      if (!corral) return null;

      // Validar cambio de lote si existe
      if (data.lote_id) {
        const lote = await Lote.findByPk(data.lote_id);
        if (!lote) {
          throw new Error('El lote especificado no existe');
        }

        // Validar que no haya cerdos si se cambia de lote
        const cerdosCount = await Cerdo.count({
          where: { corral_id: id }
        });
        if (cerdosCount > 0) {
          throw new Error('No se puede cambiar el lote de un corral con cerdos');
        }
      }

      // Validar cambio de número si existe
      if (data.numero) {
        const corralExistente = await Corral.findOne({
          where: {
            numero: data.numero,
            id: { [Op.ne]: id }
          }
        });
        if (corralExistente) {
          throw new Error('Ya existe un corral con este número');
        }
      }

      // Validar capacidad
      if (data.capacidad !== undefined) {
        if (data.capacidad <= 0) {
          throw new Error('La capacidad del corral debe ser mayor que 0');
        }
        if (data.capacidad < corral.ocupacion_actual) {
          throw new Error('La nueva capacidad no puede ser menor que la ocupación actual');
        }
      }

      await corral.update(data);
      await corral.reload({
        include: [
          { model: Lote, as: 'lote' },
          { model: Cerdo, as: 'cerdos_corral' }
        ]
      });

      return corral.toJSON() as ICorral;
    } catch (error) {
      console.error('Error en actualizarCorral:', error);
      throw new Error(`Error al actualizar el corral: ${(error as Error).message}`);
    }
  }

  /**
   * Obtiene estadísticas del corral
   * @param id ID del corral
   */
  async obtenerEstadisticasCorral(id: string) {
    try {
      const corral = await Corral.findByPk(id, {
        include: [
          { model: Cerdo, as: 'cerdos_corral' }
        ]
      });

      if (!corral) {
        throw new Error('Corral no encontrado');
      }

      const cerdos = await Cerdo.findAll({
        where: { corral_id: id }
      });

      return {
        id: corral.id,
        numero: corral.numero,
        capacidad: corral.capacidad,
        ocupacion_actual: corral.ocupacion_actual,
        porcentaje_ocupacion: ((corral.ocupacion_actual / corral.capacidad) * 100).toFixed(2),
        peso_promedio: cerdos.length > 0 
          ? (cerdos.reduce((sum, cerdo) => sum + cerdo.peso_actual, 0) / cerdos.length).toFixed(2)
          : 0,
        cerdos_enfermos: cerdos.filter(cerdo => cerdo.estado === 'ENFERMO').length
      };
    } catch (error) {
      console.error('Error en obtenerEstadisticasCorral:', error);
      throw new Error('Error al obtener estadísticas del corral');
    }
  }
}

export const corralService = new CorralService();