// lib/security.ts

/**
 * Security middleware helpers for API routes.
 * Sets common security headers (Helmet-like) and optionally applies rate limiting.
 */
export function applySecurityHeaders(res: any) {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', "geolocation=(), camera=()");
  // Content Security Policy – adjust as needed for your front‑end assets
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"
  );
}

// Simple in‑memory rate limiter (you can replace with a package like `next-rate-limit`).
const requestCounts: Record<string, { count: number; reset: number }> = {};
const MAX_REQUESTS = 100; // per window
const WINDOW_MS = 60 * 1000; // 1 minute

export function rateLimit(req: any, res: any) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (!ip) return true;
  const now = Date.now();
  const record = requestCounts[ip] ?? { count: 0, reset: now + WINDOW_MS };
  if (now > record.reset) {
    record.count = 0;
    record.reset = now + WINDOW_MS;
  }
  record.count++;
  requestCounts[ip] = record;
  if (record.count > MAX_REQUESTS) {
    res.setHeader('Retry-After', Math.ceil((record.reset - now) / 1000));
    res.status(429).json({ error: 'Too many requests' });
    return false;
  }
  return true;
}
