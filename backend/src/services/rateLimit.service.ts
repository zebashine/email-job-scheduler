import { redis } from "../lib/redis.js";
import { prisma } from "../lib/prisma.js";

// Atomically increments the per-sender, per-hour counter and rejects once
// the limit is reached. The rejected attempt is decremented back off so the
// key always reflects emails actually accepted, not attempts.
const CONSUME_SCRIPT = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local ttlSeconds = tonumber(ARGV[2])
local current = redis.call('INCR', key)
if current == 1 then
  redis.call('EXPIRE', key, ttlSeconds)
end
if current > limit then
  redis.call('DECR', key)
  return 0
end
return 1
`;

function currentHourWindow(now: Date): string {
  return now.toISOString().slice(0, 13); // e.g. "2026-08-13T13"
}

function msUntilNextHour(now: Date): number {
  const next = new Date(now);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(now.getUTCHours() + 1);
  return next.getTime() - now.getTime();
}

export interface RateLimitResult {
  allowed: boolean;
  hourWindow: string;
  retryAfterMs: number;
}

export async function checkAndConsume(senderId: string, hourlyLimit: number): Promise<RateLimitResult> {
  const now = new Date();
  const hourWindow = currentHourWindow(now);
  const key = `ratelimit:${senderId}:${hourWindow}`;
  const ttlSeconds = Math.ceil(msUntilNextHour(now) / 1000);

  const result = await redis.eval(CONSUME_SCRIPT, 1, key, hourlyLimit, ttlSeconds);
  const allowed = result === 1;

  if (allowed) {
    // Best-effort mirror into Postgres for visibility/audit; Redis remains
    // the source of truth for the atomic check.
    await prisma.rateLimit.upsert({
      where: { senderId_hourWindow: { senderId, hourWindow } },
      create: { senderId, hourWindow, count: 1 },
      update: { count: { increment: 1 } },
    });
  }

  return { allowed, hourWindow, retryAfterMs: msUntilNextHour(now) };
}

export function getMsUntilNextHour(): number {
  return msUntilNextHour(new Date());
}
