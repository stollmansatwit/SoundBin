/**
 * @file Central runtime configuration for the SoundBin backend.
 *
 * Keeps the port and the set of browser origins allowed to call the API in one
 * place, so changing the frontend's port is an `.env` edit rather than a code
 * edit. Both were previously hardcoded in `index.ts`.
 */

/** Trailing slashes break origin comparison — the browser never sends one. */
const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const DEFAULT_PORT = 3000;
const DEFAULT_FRONTEND_PORT = '5173';

/**
 * Port this API listens on.
 *
 * `PORT` is what Docker Compose sets, so it wins. `BACKEND_PORT` is accepted as
 * a fallback because that's the name used in `.env` — without it, a local
 * `npm run dev` picked up the frontend's `PORT=5173` and bound the wrong port.
 */
export const PORT: number = Number(
  process.env.PORT ?? process.env.BACKEND_PORT ?? DEFAULT_PORT,
);

const parseOrigins = (raw?: string): string[] =>
  (raw ?? '')
    .split(',')
    .map((origin) => stripTrailingSlash(origin.trim()))
    .filter(Boolean);

/**
 * Origins permitted to call the API.
 *
 * Set `FRONTEND_ORIGINS` for full control (comma-separated) — needed when
 * serving over a LAN IP or a domain name:
 *   FRONTEND_ORIGINS="http://localhost:5173,http://192.168.1.50:5173"
 *
 * Otherwise localhost and 127.0.0.1 are derived from `FRONTEND_PORT`, which
 * covers the common case of "I just want to change the port".
 */
export const ALLOWED_ORIGINS: string[] = (() => {
  const explicit = parseOrigins(process.env.FRONTEND_ORIGINS);
  if (explicit.length > 0) return explicit;

  const frontendPort = (process.env.FRONTEND_PORT ?? DEFAULT_FRONTEND_PORT).trim();
  return [`http://localhost:${frontendPort}`, `http://127.0.0.1:${frontendPort}`];
})();

/**
 * HTTP methods the API answers to.
 *
 * PATCH matters: eight frontend call sites use it (track/album/playlist edits,
 * the user & admin forms, and the listen-duration update in AudioEngine). It
 * was missing here, so the browser's preflight rejected every one of them.
 */
export const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
