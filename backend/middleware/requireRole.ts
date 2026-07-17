import type { Request, Response, NextFunction } from "express";

// Must run after authMiddleware (relies on req.user being already populated).
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Acesso restrito a este perfil de usuário" });
    }
    next();
  };
}
