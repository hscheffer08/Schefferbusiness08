/**
 * Shared admin authentication guard for maintenance/admin API endpoints.
 * Requires an x-admin-secret header matching the ADMIN_SECRET environment variable.
 * Returns an error response if the secret is missing or mismatched.
 */
export function requireAdmin(req: any, res: any): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    res.status(403).json({ error: 'Admin endpoints desabilitados: configure ADMIN_SECRET.' });
    return false;
  }
  const provided = String(req.headers?.['x-admin-secret'] || '');
  if (provided !== secret) {
    res.status(403).json({ error: 'Acesso negado.' });
    return false;
  }
  return true;
}
