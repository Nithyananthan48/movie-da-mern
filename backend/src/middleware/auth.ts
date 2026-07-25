import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

type AuthPayload = { sub: string; role: string };

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  const bearerToken = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const cookieToken = req.cookies?.admin_token ?? null;
  const token = bearerToken ?? cookieToken;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
    if (payload.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireAdminPage(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  const bearerToken = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const cookieToken = req.cookies?.admin_token ?? null;
  const token = bearerToken ?? cookieToken;
  if (!token) {
    return res.redirect("/admin/login");
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
    if (payload.role !== "admin") {
      return res.redirect("/admin/login");
    }
    req.user = payload;
    return next();
  } catch {
    return res.redirect("/admin/login");
  }
}
