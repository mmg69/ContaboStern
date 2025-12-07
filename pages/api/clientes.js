// pages/api/clientes.js
import prisma from '../../lib/server/prisma';
import { toPlain } from '../../lib/serialize';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const clientes = await prisma.cliente.findMany({
        orderBy: { created_at: 'desc' },
      });
      return res.status(200).json(toPlain(clientes));
    }

    if (req.method === 'POST') {
      const { nombre, correo, telefono, ciudad, region, pais } = req.body || {};
      const nuevo = await prisma.cliente.create({
        data: { nombre, correo, telefono, ciudad, region, pais },
      });
      return res.status(201).json(toPlain(nuevo));
    }

    if (req.method === 'PATCH') {
      const { customer_id, nombre, correo, telefono, ciudad, region, pais, activo } = req.body || {};
      if (!customer_id) return res.status(400).json({ error: 'Falta customer_id' });

      const actualizado = await prisma.cliente.update({
        where: { customer_id: BigInt(customer_id) },
        data: {
          nombre, correo, telefono, ciudad, region, pais,
          activo: activo ?? true,
          updated_at: new Date(),
        },
      });
      return res.status(200).json(toPlain(actualizado));
    }

    if (req.method === 'DELETE') {
      const { customer_id, mode } = req.body || {};
      if (!customer_id) return res.status(400).json({ error: 'Falta customer_id' });

      if (mode === 'hard') {
        try {
          await prisma.cliente.delete({ where: { customer_id: BigInt(customer_id) } });
          return res.status(204).end();
        } catch (e) {
          if (e?.code === 'P2003') {
            return res.status(409).json({ code: 'FK_CONSTRAINT', error: 'Cliente con pedidos existentes' });
          }
          console.error('DELETE cliente hard error:', e);
          return res.status(500).json({ error: 'Error interno' });
        }
      }

      if (mode === 'soft') {
        await prisma.cliente.update({
          where: { customer_id: BigInt(customer_id) },
          data: { activo: false, updated_at: new Date() },
        });
        return res.status(204).end();
      }

      return res.status(400).json({ error: 'Especifica mode: "hard" o "soft"' });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (e) {
    console.error('API clientes error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
