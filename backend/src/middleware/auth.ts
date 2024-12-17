import { Request, Response, NextFunction } from 'express';

// Por ahora, estos son middlewares simulados
export const autenticar = (req: Request, res: Response, next: NextFunction) => {
  // Aquí iría la lógica real de autenticación
  // Por ahora, solo pasamos al siguiente middleware
  next();
};

export const autorizar = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Aquí iría la lógica real de autorización
    // Por ahora, solo pasamos al siguiente middleware
    next();
  };
};