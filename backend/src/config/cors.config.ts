/** Default Next.js dev server origin (see repo root `npm run dev`). */
const DEFAULT_CORS_ORIGIN = 'http://localhost:3002';

/**
 * Comma-separated allow-list from `CORS_ORIGIN`.
 * Example: `https://app.example.com,https://preview.example.com`
 */
export function getCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw) {
    return [DEFAULT_CORS_ORIGIN];
  }

  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export function isCorsOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    return true;
  }
  return getCorsOrigins().includes(origin);
}
