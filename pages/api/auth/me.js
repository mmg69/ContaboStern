// pages/api/client/me.js
import prisma from '../../../lib/server/prisma';
import { getTokenFromReq } from '../../../utils/auth';

export default async function handler(req, res) {
  try {
    const token = getTokenFromReq(req);
    console.log('[client/me] token decodificado:', token);

    if (!token) return res.status(200).json({ ok: false });

    const email = token.email;
    console.log('[client/me] email usado:', email);

    if (!email) return res.status(200).json({ ok: false });

    const user = await prisma.cliente.findUnique({
      where: { correo: email },
      select: {
        nombre: true,
        correo: true,
        telefono: true,
        direccion: true,
        ciudad: true,
        cp: true,
        pais: true,
      },
    });

    console.log('[client/me] user encontrado:', user);

    if (!user) return res.status(200).json({ ok: false });

    return res.status(200).json({
      ok: true,
      profile: user,
    });
  } catch (err) {
    console.error('[client/me] error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
