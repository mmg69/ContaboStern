// pages/api/auth/logout.js
import { clearAuthCookie } from '../../../utils/auth';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  clearAuthCookie(res);
  return res.status(200).json({ ok: true });
}
