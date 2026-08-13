import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { signUserToken, type AuthedRequest } from "../middleware/auth.middleware.js";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}`);
  return value;
}

// Step 1: send the browser to Google's consent screen.
export function googleLogin(_req: Request, res: Response) {
  const params = new URLSearchParams({
    client_id: getEnv("GOOGLE_CLIENT_ID"),
    redirect_uri: getEnv("GOOGLE_REDIRECT_URI"),
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });
  res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}

// Step 2: Google redirects back here with a one-time code. Exchange it for
// tokens, fetch the user's profile, upsert a User row, issue our own JWT,
// and send the browser back to the frontend with that token.
export async function googleCallback(req: Request, res: Response) {
  const code = req.query["code"];
  const errorParam = req.query["error"];
  const frontendUrl = process.env["FRONTEND_URL"] ?? "http://localhost:3000";

  if (errorParam) {
    res.redirect(`${frontendUrl}/?authError=${encodeURIComponent(String(errorParam))}`);
    return;
  }
  if (typeof code !== "string") {
    res.status(400).json({ error: "Missing authorization code" });
    return;
  }

  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: getEnv("GOOGLE_CLIENT_ID"),
        client_secret: getEnv("GOOGLE_CLIENT_SECRET"),
        redirect_uri: getEnv("GOOGLE_REDIRECT_URI"),
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      throw new Error(`Google token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`);
    }
    const tokenData = (await tokenRes.json()) as { access_token: string };

    const profileRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!profileRes.ok) {
      throw new Error(`Google userinfo request failed: ${profileRes.status}`);
    }
    const profile = (await profileRes.json()) as {
      id: string;
      email: string;
      name: string;
      picture?: string;
    };

    const user = await prisma.user.upsert({
      where: { googleId: profile.id },
      update: { name: profile.name, email: profile.email, avatar: profile.picture ?? null },
      create: {
        googleId: profile.id,
        name: profile.name,
        email: profile.email,
        avatar: profile.picture ?? null,
      },
    });

    const jwtToken = signUserToken({
      id: user.id,
      googleId: user.googleId,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    });

    res.redirect(`${frontendUrl}/?token=${encodeURIComponent(jwtToken)}`);
  } catch (err) {
    console.error("Google OAuth callback failed:", err);
    res.redirect(`${frontendUrl}/?authError=oauth_failed`);
  }
}

export function getCurrentUser(req: AuthedRequest, res: Response) {
  res.json({ user: req.user ?? null });
}
