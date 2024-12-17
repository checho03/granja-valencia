import { Router } from 'express';
import { Request, Response } from 'express';
import LoteService from '../services/LoteService';
import { LoteController } from '../controllers/LoteController';
import { validarId, validarLote } from '../middleware/validaciones';
import { autenticar, autorizar } from '../middleware/auth';

const router = Router();
const loteService = new LoteService();
const loteController = new LoteController(loteService);

// Handler functions
const getTodos = async (req: Request, res: Response): Promise<void> => {
    await loteController.obtenerTodos(req, res);
};

const getPorId = async (req: Request, res: Response): Promise<void> => {
    await loteController.obtenerPorId(req, res);
};

const crear = async (req: Request, res: Response): Promise<void> => {
    await loteController.crear(req, res);
};

const actualizar = async (req: Request, res: Response): Promise<void> => {
    await loteController.actualizar(req, res);
};

// Rutas
router.get('/', getTodos);
router.get('/:id', validarId, getPorId);

router.post('/', [
    autenticar,
    autorizar(['admin']),
    validarLote,
    crear
]);

router.put('/:id', [
    autenticar,
    validarId,
    autorizar(['admin']),
    actualizar
]);

export default router;