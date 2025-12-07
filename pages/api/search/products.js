// pages/api/search/products.js
import prisma from '../../../lib/server/prisma';

export default async function handler(req, res) {
  try {
    const { q } = req.query;
    const term = (q || '').trim();

    if (!term || term.length < 2) {
      return res.status(200).json({ ok: true, results: [] });
    }

    const productos = await prisma.producto.findMany({
      where: {
        activo: true,
        OR: [
          { nombre: { contains: term, mode: 'insensitive' } },
          { categoria: { contains: term, mode: 'insensitive' } },
        ],
      },
      orderBy: { created_at: 'desc' },
      take: 8,
    });

    const plain = productos.map((p) => ({
      product_id: Number(p.product_id),
      nombre: p.nombre,
      categoria: p.categoria,
      precio: p.precio.toString(),
      image_url: p.image_url || null,
    }));

    return res.status(200).json({ ok: true, results: plain });
  } catch (err) {
    console.error('[search/products] error:', err);
    return res
      .status(500)
      .json({ ok: false, error: 'Error interno en búsqueda' });
  }
}
