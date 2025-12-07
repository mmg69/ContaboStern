// pages/api/client/upsert.js
import prisma from '../../../lib/server/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res
        .status(405)
        .json({ ok: false, error: 'Método no permitido' });
    }

    const {
      nombre,
      correo,
      telefono,
      ciudad,
      region,
      pais,
      direccion,
      cp,
      password,      // 👈 NUEVO: viene en texto plano desde el frontend
    } = req.body || {};

    if (!nombre || !correo) {
      return res.status(400).json({
        ok: false,
        error: 'Faltan campos obligatorios: nombre y correo',
      });
    }

    const now = new Date();

    let passwordData = {};
    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password.trim(), salt);
      passwordData = { password_hash: hash };
    }

    const cliente = await prisma.cliente.upsert({
      where: { correo },
      update: {
        nombre,
        telefono: telefono ?? null,
        ciudad: ciudad ?? null,
        region: region ?? null,
        pais: pais ?? null,
        direccion: direccion ?? null,
        cp: cp ?? null,
        updated_at: now,
        ...passwordData, // solo se actualiza si vino password
      },
      create: {
        nombre,
        correo,
        telefono: telefono ?? null,
        ciudad: ciudad ?? null,
        region: region ?? null,
        pais: pais ?? null,
        direccion: direccion ?? null,
        cp: cp ?? null,
        ...passwordData, // sólo si vino password
      },
    });

    const profile = {
      customer_id: cliente.customer_id.toString(),
      nombre: cliente.nombre || '',
      correo: cliente.correo || '',
      telefono: cliente.telefono || '',
      ciudad: cliente.ciudad || '',
      region: cliente.region || '',
      pais: cliente.pais || '',
      direccion: cliente.direccion || '',
      cp: cliente.cp || '',
    };

    return res.status(200).json({
      ok: true,
      profile,
    });
  } catch (err) {
    console.error('[client/upsert] error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Error al guardar perfil de cliente',
    });
  }
}
