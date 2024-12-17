import { ILote, ILoteBase } from '../interfaces';
import { Lote, Corral, Cerdo } from '../models';
import { Op } from 'sequelize';

/**
 * Servicio para la gestión de Lotes
 * Maneja toda la lógica de negocio relacionada con los lotes de cerdos
 */
class LoteService {
  /**
   * Crea un nuevo lote en el sistema
   * @param data Datos del nuevo lote
   */
  async crearLote(data: ILoteBase): Promise<ILote> {
    try {
      // Validar que el código no exista
      const loteExistente = await Lote.findOne({ where: { codigo: data.codigo } });
      if (loteExistente) {
        throw new Error('Ya existe un lote con este código');
      }

      // Validar pesos
      if (data.peso_minimo_inicial > data.peso_promedio_inicial || 
          data.peso_maximo_inicial < data.peso_promedio_inicial) {
        throw new Error('Los pesos ingresados no son consistentes');
      }

      const lote = await Lote.create({
        ...data,
        estado: data.estado || 'ACTIVO',
        cantidad_actual: data.cantidad_inicial // Al crear, la cantidad actual es igual a la inicial
      } as ILoteBase);
      
      return lote.toJSON() as ILote;
    } catch (error) {
      console.error('Error detallado:', error);
      throw new Error(`Error al crear el lote: ${(error as Error).message}`);
    }
  }

  /**
   * Obtiene todos los lotes con sus corrales asociados
   * @param filtros Opcional: filtros para la búsqueda
   */
  async obtenerLotes(filtros?: Partial<ILoteBase>): Promise<ILote[]> {
    try {
      const lotes = await Lote.findAll({
        where: filtros,
        include: [
          { 
            model: Corral, 
            as: 'corrales_lote',
            include: [{ 
              model: Cerdo, 
              as: 'cerdos_corral',
              attributes: ['id', 'peso_actual', 'estado'] 
            }]
          }
        ],
        order: [['fecha_ingreso', 'DESC']]
      });
      return lotes.map(lote => lote.toJSON() as ILote);
    } catch (error) {
      console.error('Error al obtener lotes:', error);
      throw new Error('Error al obtener los lotes');
    }
  }

  /**
   * Obtiene un lote específico por su ID
   * @param id ID del lote
   */
  async obtenerLotePorId(id: string): Promise<ILote | null> {
    try {
      const lote = await Lote.findByPk(id, {
        include: [
          { 
            model: Corral, 
            as: 'corrales_lote',
            include: [{ 
              model: Cerdo, 
              as: 'cerdos_corral' 
            }]
          }
        ]
      });
      return lote ? (lote.toJSON() as ILote) : null;
    } catch (error) {
      console.error('Error al obtener lote:', error);
      throw new Error('Error al obtener el lote');
    }
  }

  /**
   * Actualiza un lote existente
   * @param id ID del lote a actualizar
   * @param data Datos a actualizar
   */
  async actualizarLote(id: string, data: Partial<ILoteBase>): Promise<ILote | null> {
    try {
      const lote = await Lote.findByPk(id);
      if (!lote) return null;
      
      // Si se está actualizando el código, verificar que no exista
      if (data.codigo) {
        const loteExistente = await Lote.findOne({ 
          where: { 
            codigo: data.codigo,
            id: { [Op.ne]: id } // Excluir el lote actual
          } 
        });
        if (loteExistente) {
          throw new Error('Ya existe un lote con este código');
        }
      }

      await lote.update(data);
      await lote.reload({ 
        include: [{ 
          model: Corral, 
          as: 'corrales_lote' 
        }] 
      });
      
      return lote.toJSON() as ILote;
    } catch (error) {
      console.error('Error al actualizar lote:', error);
      throw new Error(`Error al actualizar el lote: ${(error as Error).message}`);
    }
    
  }
  async finalizarLote(id: string, observaciones?: string): Promise<ILote | null> {
    try {
      const lote = await Lote.findByPk(id);
      if (!lote) return null;
  
      // Verificar si el lote ya está finalizado
      if (lote.estado === 'FINALIZADO') {
        throw new Error('El lote ya está finalizado');
      }
  
      await lote.update({
        estado: 'FINALIZADO',
        observaciones: observaciones ? 
          `${lote.observaciones || ''}\n${new Date().toISOString()} - Finalización: ${observaciones}` : 
          lote.observaciones
      });
  
      await lote.reload({ 
        include: [{ 
          model: Corral, 
          as: 'corrales_lote',
          include: [{
            model: Cerdo,
            as: 'cerdos_corral'
          }]
        }] 
      });
  
      return lote.toJSON() as ILote;
    } catch (error) {
      console.error('Error al finalizar lote:', error);
      throw new Error(`Error al finalizar el lote: ${(error as Error).message}`);
    }
  }
  /**
   * Obtiene estadísticas del lote
   * @param id ID del lote
   */
  async obtenerEstadisticasLote(id: string) {
    try {
      const lote = await Lote.findByPk(id, {
        include: [
          { 
            model: Corral, 
            as: 'corrales_lote',
            include: [{ 
              model: Cerdo, 
              as: 'cerdos_corral' 
            }]
          }
        ]
      });

      if (!lote) {
        throw new Error('Lote no encontrado');
      }

      // Calcular estadísticas
      return {
        id: lote.id,
        codigo: lote.codigo,
        dias_en_sistema: Math.floor((new Date().getTime() - lote.fecha_ingreso.getTime()) / (1000 * 60 * 60 * 24)),
        cantidad_inicial: lote.cantidad_inicial,
        cantidad_actual: lote.cantidad_actual,
        mortalidad: ((lote.cantidad_inicial - lote.cantidad_actual) / lote.cantidad_inicial * 100).toFixed(2),
        // Agregar más estadísticas según necesidades
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw new Error('Error al obtener estadísticas del lote');
    }
  }
}

export default LoteService;