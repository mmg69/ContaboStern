// pages/api/auth/login.js
import prisma from '../../../lib/server/prisma';
import bcrypt from 'bcryptjs';
import { setAuthCookie } from '../../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { correo, email, password } = req.body || {};
    const identifier = correo || email; // aceptamos ambos nombres

    if (!identifier || !password) {
      return res.status(400).json({
        ok: false,
        error: 'Faltan correo/email o contraseña',
      });
    }

    // Buscar cliente por correo
    const cliente = await prisma.cliente.findUnique({
      where: { correo: identifier },
    });

    if (!cliente) {
      return res.status(401).json({
        ok: false,
        error: 'Credenciales inválidas',
      });
    }

    // Comparar contraseña
    const isValid = await bcrypt.compare(password, cliente.password_hash);

    if (!isValid) {
      return res.status(401).json({
        ok: false,
        error: 'Credenciales inválidas',
      });
    }

    // Token que guardamos en la cookie → siempre usar el correo real de BD
    const tokenData = { email: cliente.correo };

    // Guardar cookie httpOnly con base64(JSON)
    setAuthCookie(res, tokenData);

    return res.status(200).json({
      ok: true,
      nombre: cliente.nombre,
      correo: cliente.correo,
    });
  } catch (err) {
    console.error('[auth/login] error:', err);
    return res.status(500).json({
      ok: false,
      error: 'Error interno al iniciar sesión',
    });
  }
}
