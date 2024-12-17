import { ICerdo, ICerdoBase } from '../interfaces';
import { Cerdo, Lote, Corral } from '../models';
import { Op, Transaction } from 'sequelize';
import sequelize from '../config/database';

// Definición de tipos para el manejo de errores
enum CerdoErrorType {
  NOT_FOUND = 'CERDO_NOT_FOUND',
  DUPLICATE_ARETE = 'DUPLICATE_ARETE',
  INVALID_WEIGHT = 'INVALID_WEIGHT',
  CORRAL_FULL = 'CORRAL_FULL',
  INVALID_TRANSFER = 'INVALID_TRANSFER'
}

class CerdoError extends Error {
  constructor(
    public type: CerdoErrorType,
    message: string
  ) {
    super(message);
    this.name = 'CerdoError';
  }
}

// Interfaz para el historial de cambios
interface ICambioHistorial {
  fecha: Date;
  tipo: 'PESO' | 'ESTADO' | 'CORRAL';
  valorAnterior: any;
  valorNuevo: any;
  observaciones?: string;
}

/**
 * Servicio para la gestión de Cerdos
 * Maneja toda la lógica de negocio relacionada con los cerdos individuales
 */
export class CerdoService {
  /**
   * Crea un nuevo cerdo en el sistema
   * @param data Datos del nuevo cerdo
   */
  async crearCerdo(data: ICerdoBase): Promise<ICerdo> {
    const transaction = await sequelize.transaction();
    try {
      // Validar que el lote existe
      const lote = await Lote.findByPk(data.lote_id);
      if (!lote) {
        throw new CerdoError(CerdoErrorType.NOT_FOUND, 'El lote especificado no existe');
      }

      // Validar que el corral existe y pertenece al lote
      const corral = await Corral.findOne({
        where: {
          id: data.corral_id,
          lote_id: data.lote_id
        }
      });
      if (!corral) {
        throw new CerdoError(CerdoErrorType.NOT_FOUND, 'El corral especificado no existe o no pertenece al lote');
      }

      // Validar capacidad del corral
      if (corral.ocupacion_actual >= corral.capacidad) {
        throw new CerdoError(CerdoErrorType.CORRAL_FULL, 'El corral ha alcanzado su capacidad máxima');
      }

      // Validar que el arete no esté duplicado
      const cerdoExistente = await Cerdo.findOne({
        where: { arete: data.arete }
      });
      if (cerdoExistente) {
        throw new CerdoError(CerdoErrorType.DUPLICATE_ARETE, 'Ya existe un cerdo con este número de arete');
      }

      // Crear el cerdo
      const cerdo = await Cerdo.create({
        ...data,
        estado: 'ACTIVO',
        peso_actual: data.peso_inicial,
        ultima_fecha_pesaje: new Date()
      }, { transaction });

      // Registrar el cambio inicial
      await this.registrarCambio(cerdo, {
        fecha: new Date(),
        tipo: 'PESO',
        valorAnterior: 0,
        valorNuevo: data.peso_inicial,
        observaciones: 'Peso inicial al crear cerdo'
      }, transaction);

      // Actualizar ocupación del corral
      await corral.increment('ocupacion_actual', { by: 1, transaction });

      // Actualizar cantidad actual del lote
      await lote.increment('cantidad_actual', { by: 1, transaction });

      // Actualizar peso promedio del corral
      await this.actualizarPesoPromedioCorral(corral.id, transaction);

      await transaction.commit();

      await cerdo.reload({
        include: [
          { model: Lote, as: 'lote' },
          { model: Corral, as: 'corral' }
        ]
      });

      return cerdo.toJSON() as ICerdo;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof CerdoError) {
        throw error;
      }
      throw new Error(`Error al crear el cerdo: ${(error as Error).message}`);
    }
  }

  /**
   * Registra un nuevo pesaje para un cerdo
   * @param id ID del cerdo
   * @param nuevoPeso Nuevo peso registrado
   */
  async registrarPesaje(id: string, nuevoPeso: number): Promise<ICerdo> {
    const transaction = await sequelize.transaction();
    try {
      const cerdo = await Cerdo.findByPk(id);
      if (!cerdo) {
        throw new CerdoError(CerdoErrorType.NOT_FOUND, 'Cerdo no encontrado');
      }

      if (nuevoPeso <= 0) {
        throw new CerdoError(CerdoErrorType.INVALID_WEIGHT, 'El peso debe ser mayor que 0');
      }

      // Validar variación de peso
      if (cerdo.peso_actual > 0) {
        await this.validarPeso(cerdo.peso_actual, nuevoPeso);
      }

      const pesoAnterior = cerdo.peso_actual;

      // Actualizar peso del cerdo
      await cerdo.update({
        peso_actual: nuevoPeso,
        ultima_fecha_pesaje: new Date()
      }, { transaction });

      // Registrar el cambio de peso
      await this.registrarCambio(cerdo, {
        fecha: new Date(),
        tipo: 'PESO',
        valorAnterior: pesoAnterior,
        valorNuevo: nuevoPeso
      }, transaction);

      // Actualizar peso promedio del corral
      await this.actualizarPesoPromedioCorral(cerdo.corral_id, transaction);

      await transaction.commit();

      return cerdo.toJSON() as ICerdo;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof CerdoError) {
        throw error;
      }
      throw new Error(`Error al registrar pesaje: ${(error as Error).message}`);
    }
  }

  /**
   * Cambia el estado de un cerdo
   */
  async cambiarEstado(
    id: string, 
    nuevoEstado: 'ACTIVO' | 'VENDIDO' | 'MUERTO' | 'ENFERMO',
    observacion?: string
  ): Promise<ICerdo> {
    const transaction = await sequelize.transaction();
    try {
      const cerdo = await Cerdo.findByPk(id);
      if (!cerdo) {
        throw new CerdoError(CerdoErrorType.NOT_FOUND, 'Cerdo no encontrado');
      }

      const estadoAnterior = cerdo.estado;

      // Si el cerdo muere o se vende, actualizar cantidades
      if ((nuevoEstado === 'MUERTO' || nuevoEstado === 'VENDIDO') && 
          cerdo.estado === 'ACTIVO') {
        // Reducir ocupación del corral
        await Corral.decrement('ocupacion_actual', {
          by: 1,
          where: { id: cerdo.corral_id },
          transaction
        });

        // Reducir cantidad actual del lote
        await Lote.decrement('cantidad_actual', {
          by: 1,
          where: { id: cerdo.lote_id },
          transaction
        });
      }

      // Registrar el cambio de estado
      await this.registrarCambio(cerdo, {
        fecha: new Date(),
        tipo: 'ESTADO',
        valorAnterior: estadoAnterior,
        valorNuevo: nuevoEstado,
        observaciones: observacion
      }, transaction);

      await cerdo.update({
        estado: nuevoEstado
      }, { transaction });

      await transaction.commit();

      return cerdo.toJSON() as ICerdo;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof CerdoError) {
        throw error;
      }
      throw new Error(`Error al cambiar estado: ${(error as Error).message}`);
    }
  }

  /**
   * Transfiere un cerdo a otro corral
   */
  async transferirCerdo(idCerdo: string, idNuevoCorral: string): Promise<ICerdo> {
    const transaction = await sequelize.transaction();
    try {
      const cerdo = await Cerdo.findByPk(idCerdo);
      if (!cerdo) {
        throw new CerdoError(CerdoErrorType.NOT_FOUND, 'Cerdo no encontrado');
      }

      const corralDestino = await Corral.findByPk(idNuevoCorral);
      if (!corralDestino) {
        throw new CerdoError(CerdoErrorType.NOT_FOUND, 'Corral destino no encontrado');
      }

      // Validar capacidad del nuevo corral
      if (corralDestino.ocupacion_actual >= corralDestino.capacidad) {
        throw new CerdoError(CerdoErrorType.CORRAL_FULL, 'Corral destino sin capacidad disponible');
      }

      const corralAnterior = cerdo.corral_id;

      // Actualizar corrales
      const corralOrigen = await Corral.findByPk(cerdo.corral_id);
      if (corralOrigen) {
        await corralOrigen.decrement('ocupacion_actual', { transaction });
        await corralDestino.increment('ocupacion_actual', { transaction });
      }

      // Registrar el cambio de corral
      await this.registrarCambio(cerdo, {
        fecha: new Date(),
        tipo: 'CORRAL',
        valorAnterior: corralAnterior,
        valorNuevo: idNuevoCorral
      }, transaction);

      // Actualizar cerdo
      await cerdo.update({ corral_id: idNuevoCorral }, { transaction });

      // Actualizar pesos promedio
      await this.actualizarPesoPromedioCorral(corralAnterior, transaction);
      await this.actualizarPesoPromedioCorral(idNuevoCorral, transaction);

      await transaction.commit();

      await cerdo.reload({
        include: [
          { model: Lote, as: 'lote' },
          { model: Corral, as: 'corral' }
        ]
      });

      return cerdo.toJSON() as ICerdo;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof CerdoError) {
        throw error;
      }
      throw new Error(`Error al transferir cerdo: ${(error as Error).message}`);
    }
  }

  /**
   * Métodos privados auxiliares
   */
  
  private async validarPeso(pesoActual: number, pesoNuevo: number): Promise<boolean> {
    const variacionMaxima = 0.3; // 30% de variación máxima permitida
    const diferenciaPorcentual = Math.abs(pesoNuevo - pesoActual) / pesoActual;
    
    if (diferenciaPorcentual > variacionMaxima) {
      throw new CerdoError(
        CerdoErrorType.INVALID_WEIGHT,
        'Variación de peso sospechosa. Por favor verificar.'
      );
    }
    return true;
  }

  private async actualizarPesoPromedioCorral(
    corralId: string, 
    transaction: Transaction
  ): Promise<void> {
    const cerdos = await Cerdo.findAll({
      where: { 
        corral_id: corralId,
        estado: 'ACTIVO'
      },
      transaction
    });
    
    if (cerdos.length > 0) {
      const promedio = cerdos.reduce((sum, c) => sum + c.peso_actual, 0) / cerdos.length;
      await Corral.update(
        { peso_promedio_actual: promedio },
        { where: { id: corralId }, transaction }
      );
    }
  }

  private async registrarCambio(
    cerdo: Cerdo, 
    cambio: ICambioHistorial, 
    transaction: Transaction
  ): Promise<void> {
    const observacion = `${cambio.fecha.toISOString()} - ${cambio.tipo}: ${cambio.valorAnterior} -> ${cambio.valorNuevo}${
      cambio.observaciones ? ` (${cambio.observaciones})` : ''
    }`;
    
    await cerdo.update({
      observaciones: cerdo.observaciones ? 
        `${cerdo.observaciones}\n${observacion}` : 
        observacion
    }, { transaction });
  }

  /**
   * Obtiene el historial de cambios de un cerdo
   */
  async obtenerHistorial(id: string): Promise<ICambioHistorial[]> {
    const cerdo = await Cerdo.findByPk(id);
    if (!cerdo) {
      throw new CerdoError(CerdoErrorType.NOT_FOUND, 'Cerdo no encontrado');
    }

    // Por ahora extraemos el historial de las observaciones
    // En una implementación futura esto vendría de una tabla separada
    const historial: ICambioHistorial[] = [];
    if (cerdo.observaciones) {
      const lineas = cerdo.observaciones.split('\n');
      for (const linea of lineas) {
        const match = linea.match(/^(.+) - (PESO|ESTADO|CORRAL): (.+) -> (.+?)(?:\s*\((.*)\))?$/);
        if (match) {
          historial.push({
            fecha: new Date(match[1]),
            tipo: match[2] as 'PESO' | 'ESTADO' | 'CORRAL',
            valorAnterior: match[3],
            valorNuevo: match[4],
            observaciones: match[5]
          });
        }
      }
    }
    
    return historial;
  }
}

export const cerdoService = new CerdoService();