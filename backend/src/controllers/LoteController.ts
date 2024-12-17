// Al principio del archivo LoteController.ts
import { Request, Response } from 'express';
import Joi from 'joi';
import LoteService from '../services/LoteService';
import { ILoteBase } from '../interfaces';
import { loteSchema, updateLoteSchema } from '../schemas/validation';

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
 * Controlador para la gestión de Lotes
 * Maneja las peticiones HTTP relacionadas con los lotes de cerdos
 */
export class LoteController {
  constructor(private loteService: LoteService) {}

  /**
   * Crea un nuevo lote
   * @route POST /lotes
   */
  public crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const { error, value } = loteSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        throw new ValidationError(error.details.map(detail => detail.message).join(', '));
      }

      const lote = await this.loteService.crearLote(value);
      this.sendResponse(res, HttpStatus.CREATED, { data: lote });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Obtiene todos los lotes con filtros opcionales
   * @route GET /lotes
   */
  public obtenerTodos = async (req: Request, res: Response): Promise<void> => {
    try {
      const filtros = this.validarFiltros(req.query);
      const lotes = await this.loteService.obtenerLotes(filtros);
      this.sendResponse(res, HttpStatus.OK, { data: lotes });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Obtiene un lote por su ID
   * @route GET /lotes/:id
   */
  public obtenerPorId = async (req: Request, res: Response): Promise<void> => {
    try {
      const lote = await this.loteService.obtenerLotePorId(req.params.id);
      if (!lote) throw new NotFoundError('Lote no encontrado');
      this.sendResponse(res, HttpStatus.OK, { data: lote });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Actualiza un lote existente
   * @route PUT /lotes/:id
   */
  public actualizar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { error, value } = updateLoteSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        throw new ValidationError(error.details.map(detail => detail.message).join(', '));
      }

      const lote = await this.loteService.actualizarLote(req.params.id, value);
      if (!lote) throw new NotFoundError('Lote no encontrado');
      this.sendResponse(res, HttpStatus.OK, { data: lote });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Obtiene estadísticas de un lote
   * @route GET /lotes/:id/estadisticas
   */
  public obtenerEstadisticas = async (req: Request, res: Response): Promise<void> => {
    try {
      const estadisticas = await this.loteService.obtenerEstadisticasLote(req.params.id);
      this.sendResponse(res, HttpStatus.OK, { data: estadisticas });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Finaliza un lote
   * @route PUT /lotes/:id/finalizar
   */
  public finalizar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { observaciones } = req.body;
      const lote = await this.loteService.finalizarLote(req.params.id, observaciones);
      this.sendResponse(res, HttpStatus.OK, { data: lote });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // Métodos privados de utilidad

  private validarFiltros(query: any): Partial<ILoteBase> {
    const schema = Joi.object({
      estado: Joi.string().valid('ACTIVO', 'FINALIZADO'),
      sitio: Joi.string().valid('LECHON', 'ENGORDE'),
      semana_ingreso: Joi.number(),
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
    console.error('Error en LoteController:', error);

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

export const loteController = new LoteController(new LoteService());