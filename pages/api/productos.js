// pages/api/productos.js

import { toPlain } from '../../lib/serialize';
import prisma from '../../lib/server/prisma';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const productos = await prisma.producto.findMany({
        orderBy: { created_at: 'desc' },
      });
      return res.status(200).json(toPlain(productos));
    }

    if (req.method === 'POST') {
      const { nombre, precio, cantidad_stock, categoria, image_url } = req.body || {};
      const created = await prisma.producto.create({
        data: {
          nombre,
          precio,
          cantidad_stock,
          categoria,
          image_url: (image_url || '').trim() || null, // aquí guardas solo "foco.jpg" si quieres
        },
      });
      return res.status(201).json(toPlain(created));
    }

    if (req.method === 'PATCH') {
      const { product_id, nombre, precio, cantidad_stock, categoria, activo, image_url } = req.body || {};
      const updated = await prisma.producto.update({
        where: { product_id: BigInt(product_id) },
        data: {
          nombre,
          precio,
          cantidad_stock,
          categoria,
          activo: !!activo,
          image_url: (image_url || '').trim() || null,
          updated_at: new Date(),
        },
      });
      return res.status(200).json(toPlain(updated));
    }

    if (req.method === 'DELETE') {
      const { product_id, mode } = req.body || {};
      if (mode === 'soft') {
        await prisma.producto.update({
          where: { product_id: BigInt(product_id) },
          data: { activo: false, updated_at: new Date() },
        });
        return res.status(204).end();
      }
      await prisma.producto.delete({ where: { product_id: BigInt(product_id) } });
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    if (e?.code === 'P2003') {
      return res.status(409).json({ code: 'FK_CONSTRAINT', error: 'Relacionado con pedidos' });
    }
    console.error('API productos error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
