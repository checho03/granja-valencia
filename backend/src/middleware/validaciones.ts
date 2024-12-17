import { Request, Response, NextFunction } from 'express';

export const validarId = (req: Request, res: Response, next: NextFunction): void => {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(id)) {
        res.status(400).json({ error: 'ID inválido' });
        return;
    }
    
    next();
};

export const validarLote = (req: Request, res: Response, next: NextFunction): void => {
    const { codigo, cantidad_inicial, peso_promedio_inicial, peso_minimo_inicial, peso_maximo_inicial } = req.body;

    if (!codigo || !cantidad_inicial || !peso_promedio_inicial || !peso_minimo_inicial || !peso_maximo_inicial) {
        res.status(400).json({ error: 'Faltan campos requeridos' });
        return;
    }

    if (cantidad_inicial <= 0) {
        res.status(400).json({ error: 'La cantidad inicial debe ser mayor que 0' });
        return;
    }

    if (peso_minimo_inicial > peso_promedio_inicial || peso_maximo_inicial < peso_promedio_inicial) {
        res.status(400).json({ error: 'Los pesos no son consistentes' });
        return;
    }

    next();
};