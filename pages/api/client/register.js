// pages/api/client/register.js
import prisma from '../../../lib/server/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const {
      nombre,
      correo,
      telefono,
      ciudad,
      region,
      pais,
      direccion,
      cp,
      password,
    } = req.body || {};

    // Validaciones básicas
    if (!nombre || !correo || !password) {
      return res.status(400).json({
        ok: false,
        error: 'Nombre, correo y contraseña son obligatorios',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        ok: false,
        error: 'La contraseña debe tener al menos 6 caracteres',
      });
    }

    // ¿Ya existe un cliente con ese correo?
    const existing = await prisma.cliente.findUnique({
      where: { correo },
    });

    if (existing) {
      return res.status(409).json({
        ok: false,
        error: 'Ya existe un cliente registrado con ese correo',
      });
    }

    // Hash de contraseña
    const password_hash = await bcrypt.hash(password, 10);

    // Crear cliente
    const nuevo = await prisma.cliente.create({
      data: {
        nombre,
        correo,
        telefono: telefono || null,
        ciudad: ciudad || null,
        region: region || null,
        pais: pais || null,
        direccion: direccion || null,
        cp: cp || null,
        password_hash,
        // fecha_alta, activo, created_at, etc. usan sus defaults
      },
    });

    return res.status(201).json({
      ok: true,
      cliente_id: String(nuevo.customer_id),
    });
  } catch (err) {
    console.error('[client/register] error:', err);
    return res.status(500).json({
      ok: false,
      error: 'Error interno al registrar el cliente',
    });
  }
}
