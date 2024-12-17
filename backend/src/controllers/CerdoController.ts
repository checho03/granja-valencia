import Joi from 'joi';
import { Request, Response } from 'express';
import CerdoService from '../services/CerdoService';
import { ICerdoBase } from '../interfaces';
import { cerdoSchema, updateCerdoSchema } from '../schemas/validation';

/**
 * Enumeración para los códigos de estado HTTP
 */
enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  INTERNAL_ERROR = 500
}

/**
 * Clases personalizadas de error
 */
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Interfaz para respuestas estandarizadas
 */
interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  details?: any;
}

/**
 * Controlador para la gestión de Cerdos
 */
export class CerdoController {
  constructor(private cerdoService: CerdoService) {}

  /**
   * Crea un nuevo cerdo
   * @route POST /cerdos
   */
  public crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const { error, value } = cerdoSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        throw new ValidationError(error.details.map(detail => detail.message).join(', '));
      }

      const cerdo = await this.cerdoService.crearCerdo(value);
      this.sendResponse(res, HttpStatus.CREATED, { data: cerdo });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Registra un nuevo pesaje
   * @route POST /cerdos/:id/pesaje
   */
  public registrarPesaje = async (req: Request, res: Response): Promise<void> => {
    try {
      const schema = Joi.object({
        peso: Joi.number().min(0).required(),
        fecha: Joi.date().max('now').default(new Date())
      });

      const { error, value } = schema.validate(req.body);
      if (error) throw new ValidationError(error.details[0].message);

      const cerdo = await this.cerdoService.registrarPesaje(
        req.params.id,
        value.peso,
        value.fecha
      );

      this.sendResponse(res, HttpStatus.OK, { data: cerdo });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Cambia el estado de un cerdo
   * @route PUT /cerdos/:id/estado
   */
  public cambiarEstado = async (req: Request, res: Response): Promise<void> => {
    try {
      const schema = Joi.object({
        estado: Joi.string()
          .valid('ACTIVO', 'VENDIDO', 'MUERTO', 'ENFERMO')
          .required(),
        observacion: Joi.string().max(1000)
      });

      const { error, value } = schema.validate(req.body);
      if (error) throw new ValidationError(error.details[0].message);

      const cerdo = await this.cerdoService.cambiarEstado(
        req.params.id,
        value.estado,
        value.observacion
      );

      this.sendResponse(res, HttpStatus.OK, { data: cerdo });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Transfiere un cerdo a otro corral
   * @route POST /cerdos/:id/transferir
   */
  public transferir = async (req: Request, res: Response): Promise<void> => {
    try {
      const schema = Joi.object({
        corralId: Joi.string().uuid().required(),
        observacion: Joi.string().max(1000)
      });

      const { error, value } = schema.validate(req.body);
      if (error) throw new ValidationError(error.details[0].message);

      const cerdo = await this.cerdoService.transferirCerdo(
        req.params.id,
        value.corralId,
        value.observacion
      );

      this.sendResponse(res, HttpStatus.OK, { data: cerdo });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Obtiene todos los cerdos con filtros opcionales
   * @route GET /cerdos
   */
  public obtenerTodos = async (req: Request, res: Response): Promise<void> => {
    try {
      const filtros = this.validarFiltros(req.query);
      const cerdos = await this.cerdoService.obtenerCerdos(filtros);
      this.sendResponse(res, HttpStatus.OK, { data: cerdos });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Obtiene un cerdo por su ID
   * @route GET /cerdos/:id
   */
  public obtenerPorId = async (req: Request, res: Response): Promise<void> => {
    try {
      const cerdo = await this.cerdoService.obtenerCerdoPorId(req.params.id);
      if (!cerdo) throw new NotFoundError('Cerdo no encontrado');
      this.sendResponse(res, HttpStatus.OK, { data: cerdo });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Obtiene el historial de un cerdo
   * @route GET /cerdos/:id/historial
   */
  public obtenerHistorial = async (req: Request, res: Response): Promise<void> => {
    try {
      const historial = await this.cerdoService.obtenerHistorial(req.params.id);
      this.sendResponse(res, HttpStatus.OK, { data: historial });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // Métodos privados de utilidad

  private validarFiltros(query: any): Partial<ICerdoBase> {
    const schema = Joi.object({
      lote_id: Joi.string().uuid(),
      corral_id: Joi.string().uuid(),
      estado: Joi.string().valid('ACTIVO', 'VENDIDO', 'MUERTO', 'ENFERMO'),
      fecha_ingreso: Joi.date()
    }).unknown(true);

    const { error, value } = schema.validate(query);
    if (error) throw new ValidationError(error.details[0].message);
    return value;
  }

  private sendResponse<T>(res: Response, statusCode: HttpStatus, { data, message }: Partial<ApiResponse<T>>): void {
    res.status(statusCode).json({
      status: 'success',
      data,
      message
    });
  }

  private handleError(res: Response, error: any): void {
    console.error('Error en CerdoController:', error);

    let statusCode = HttpStatus.INTERNAL_ERROR;
    let errorMessage = 'Error interno del servidor';

    if (error instanceof ValidationError) {
      statusCode = HttpStatus.BAD_REQUEST;
      errorMessage = error.message;
    } else if (error instanceof NotFoundError) {
      statusCode = HttpStatus.NOT_FOUND;
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    res.status(statusCode).json({
      status: 'error',
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { details: error.stack })
    });
  }
}

export const cerdoController = new CerdoController(new CerdoService());