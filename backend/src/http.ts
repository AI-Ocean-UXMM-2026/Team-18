// ===========================================================================
//  http.ts — Express helpers: errors, JSON routes, validation, role guards.
// ===========================================================================
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { z } from "zod";
import { readToken, type AdminRole, type Role, type Session } from "./auth.js";
import { one } from "./db.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express { interface Request { session?: Session } }
}

export class HttpError extends Error { constructor(readonly status: number, message: string) { super(message); } }
export const badRequest = (m: string) => new HttpError(400, m);
export const unauthorized = (m = "Please sign in.") => new HttpError(401, m);
export const forbidden = (m = "You do not have access to this.") => new HttpError(403, m);
export const notFound = (m = "Not found.") => new HttpError(404, m);
export const conflict = (m: string) => new HttpError(409, m);
export const tooMany = (m = "Too many requests. Please try again later.") => new HttpError(429, m);

export function route(handler: (req: Request, res: Response) => unknown | Promise<unknown>): RequestHandler {
  return async (req, res, next) => {
    try { const result = await handler(req, res); if (!res.headersSent) res.json(result ?? { ok: true }); }
    catch (e) { next(e); }
  };
}

export function body<T extends z.ZodTypeAny>(req: Request, schema: T): z.infer<T> {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw badRequest(parsed.error.issues.map(i => `${i.path.join(".") || "body"}: ${i.message}`).join("; "));
  return parsed.data;
}

/** Reads the Bearer token (if any) on every request. */
export const attachSession: RequestHandler = async (req, _res, next) => {
  const h = req.headers.authorization;
  if (h?.startsWith("Bearer ")) {
    const s = await readToken(h.slice(7));
    if (s) {
      const user = await one<{ active: boolean }>("SELECT active FROM users WHERE id = $1", [s.uid]).catch(() => null);
      if (user?.active) req.session = s;
    }
  }
  next();
};

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.session) return next(unauthorized());
    if (!roles.includes(req.session.role)) return next(forbidden());
    next();
  };
}
/** Admin sub-roles: super can do everything. */
export function requireAdmin(...allowed: AdminRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.session) return next(unauthorized());
    if (req.session.role !== "admin") return next(forbidden());
    if (req.session.adminRole !== "super" && !allowed.includes(req.session.adminRole as AdminRole)) return next(forbidden("Your admin role cannot do this."));
    next();
  };
}
export const sessionOf = (req: Request) => { if (!req.session) throw unauthorized(); return req.session; };

export function errorMiddleware(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
  const pgErr = error as { code?: string; constraint?: string };
  if (pgErr?.code === "23505") return res.status(409).json({ error: "This was already submitted." });
  if ((error as { type?: string })?.type === "entity.too.large") return res.status(413).json({ error: "The upload is too large (max 1 MB image)." });
  console.error(error);
  res.status(500).json({ error: "Something went wrong on the server." });
}
