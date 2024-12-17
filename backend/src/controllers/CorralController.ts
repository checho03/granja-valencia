import Joi from 'joi';
import { Request, Response } from 'express';
import CorralService from '../services/CorralService';
import { ICorralBase } from '../interfaces';
import { corralSchema, updateCorralSchema } from '../schemas/validation';

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
 * Controlador para la gestión de Corrales
 */
export class CorralController {
  constructor(private corralService: CorralService) {}

  /**
   * Crea un nuevo corral
   * @route POST /corrales
   */
  public crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const { error, value } = corralSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        throw new ValidationError(error.details.map(detail => detail.message).join(', '));
      }

      const corral = await this.corralService.crearCorral(value);
      this.sendResponse(res, HttpStatus.CREATED, { data: corral });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Obtiene todos los corrales
   * @route GET /corrales
   */
  public obtenerTodos = async (req: Request, res: Response): Promise<void> => {
    try {
      const filtros = this.validarFiltros(req.query);
      const corrales = await this.corralService.obtenerCorrales(filtros);
      this.sendResponse(res, HttpStatus.OK, { data: corrales });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Obtiene un corral por su ID
   * @route GET /corrales/:id
   */
  public obtenerPorId = async (req: Request, res: Response): Promise<void> => {
    try {
      const corral = await this.corralService.obtenerCorralPorId(req.params.id);
      if (!corral) throw new NotFoundError('Corral no encontrado');
      this.sendResponse(res, HttpStatus.OK, { data: corral });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Actualiza un corral existente
   * @route PUT /corrales/:id
   */
  public actualizar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { error, value } = updateCorralSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        throw new ValidationError(error.details.map(detail => detail.message).join(', '));
      }

      const corral = await this.corralService.actualizarCorral(req.params.id, value);
      if (!corral) throw new NotFoundError('Corral no encontrado');
      this.sendResponse(res, HttpStatus.OK, { data: corral });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Obtiene estadísticas de un corral
   * @route GET /corrales/:id/estadisticas
   */
  public obtenerEstadisticas = async (req: Request, res: Response): Promise<void> => {
    try {
      const estadisticas = await this.corralService.obtenerEstadisticasCorral(req.params.id);
      this.sendResponse(res, HttpStatus.OK, { data: estadisticas });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Obtiene los cerdos de un corral
   * @route GET /corrales/:id/cerdos
   */
  public obtenerCerdos = async (req: Request, res: Response): Promise<void> => {
    try {
      const cerdos = await this.corralService.obtenerCerdosCorral(req.params.id);
      this.sendResponse(res, HttpStatus.OK, { data: cerdos });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // Métodos privados de utilidad

  private validarFiltros(query: any): Partial<ICorralBase> {
    const schema = Joi.object({
      lote_id: Joi.string().uuid(),
      tipo: Joi.string().valid('LECHON', 'ENGORDE', 'ENFERMERIA')
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
    console.error('Error en CorralController:', error);

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

export const corralController = new CorralController(new CorralService());