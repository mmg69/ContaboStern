// pages/api/categorias.js
import prisma from '../../lib/server/prisma';
import { toPlain } from '../../lib/serialize';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const categorias = await prisma.categoria.findMany({
        orderBy: { categoria_id: 'asc' },
        select: { categoria_id: true, nombre: true, created_at: true },
      });
      return res.status(200).json(toPlain(categorias));
    }

    if (req.method === 'POST') {
      const { nombre } = req.body || {};
      if (!nombre?.trim()) return res.status(400).json({ error: 'Falta nombre' });
      const created = await prisma.categoria.create({ data: { nombre: nombre.trim() } });
      return res.status(201).json(toPlain(created));
    }

    if (req.method === 'DELETE') {
      const { categoria_id } = req.body || {};
      if (!categoria_id) return res.status(400).json({ error: 'Falta categoria_id' });

      // (Opcional) Bloquear si hay productos usando esa categoría por texto
      const cat = await prisma.categoria.findUnique({
        where: { categoria_id: BigInt(categoria_id) },
        select: { nombre: true },
      });
      if (!cat) return res.status(404).json({ error: 'Categoría no encontrada' });

      // Como productos.categoria es TEXTO, verificamos si hay alguno con ese nombre
      const usados = await prisma.producto.count({
        where: { categoria: cat.nombre },
      });
      if (usados > 0) {
        return res.status(409).json({
          code: 'CATEGORY_IN_USE',
          error: `No se puede eliminar la categoría porque ${usados} producto(s) la usan.`,
        });
      }

      await prisma.categoria.delete({
        where: { categoria_id: BigInt(categoria_id) },
      });
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('API categorias error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
