import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env["JWT_SECRET"] ?? "dev_secret_change_me";

export interface AuthedRequest extends Request {
  user?: { id: string; googleId: string; name: string; email: string; avatar: string | null };
}

export function signUserToken(user: { id: string; googleId: string; name: string; email: string; avatar: string | null }) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

// Verifies the Bearer JWT and attaches the decoded user to the request.
// Used to protect routes that need to know who the logged-in user is.
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) {
    res.status(401).json({ error: "Missing Authorization bearer token" });
    return;
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET) as AuthedRequest["user"];
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Like requireAuth, but doesn't reject the request if there's no token —
// just attaches req.user when a valid one is present. Useful for routes
// that behave slightly differently for logged-in users without requiring it.
export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET) as AuthedRequest["user"];
    } catch {
      // ignore invalid token, treat as anonymous
    }
  }
  next();
}
