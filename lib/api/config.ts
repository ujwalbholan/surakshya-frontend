/**
 * Same-origin proxy path (see next.config.ts rewrites → AMS backend).
 * Avoids browser CORS blocks when calling Render directly from localhost/production.
 */
export const API_BASE_URL = "/api/ams"
