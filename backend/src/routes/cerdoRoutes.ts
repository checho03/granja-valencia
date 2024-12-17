import { Router } from 'express';
import { CerdoController } from '../controllers/CerdoController';
import { validarId } from '../middleware/validaciones';
import { autenticar, autorizar } from '../middleware/auth';

const router = Router();
const cerdoController = new CerdoController();

router.get('/', cerdoController.obtenerTodos);
router.get('/:id', validarId, cerdoController.obtenerPorId);
router.post('/', [autenticar, autorizar(['admin'])], cerdoController.crear);
router.put('/:id', [autenticar, validarId, autorizar(['admin'])], cerdoController.actualizar);

export default router;