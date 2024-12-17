import { Router } from 'express';
import { Request, Response } from 'express';
import { CorralController } from '../controllers/CorralController';
import { CorralService } from '../services/CorralService';
import { validarId } from '../middleware/validaciones';
import { autenticar, autorizar } from '../middleware/auth';

const router = Router();
const corralService = new CorralService();
const corralController = new CorralController(corralService);

// Handler functions
const getTodos = async (req: Request, res: Response): Promise<void> => {
    await corralController.obtenerTodos(req, res);
};

const getPorId = async (req: Request, res: Response): Promise<void> => {
    await corralController.obtenerPorId(req, res);
};

const crear = async (req: Request, res: Response): Promise<void> => {
    await corralController.crear(req, res);
};

const actualizar = async (req: Request, res: Response): Promise<void> => {
    await corralController.actualizar(req, res);
};

// Rutas
router.get('/', getTodos);
router.get('/:id', validarId, getPorId);

router.post('/', [
    autenticar,
    autorizar(['admin']),
    crear
]);

router.put('/:id', [
    autenticar,
    validarId,
    autorizar(['admin']),
    actualizar
]);

export default router;