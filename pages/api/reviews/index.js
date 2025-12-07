// pages/api/reviews/index.js
import prisma from '../../../lib/server/prisma';
import { getTokenFromReq } from '../../../utils/auth';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // GET /api/reviews?product_id=123
      const productIdRaw = req.query.product_id;
      if (!productIdRaw) {
        return res
          .status(400)
          .json({ ok: false, error: 'Falta product_id' });
      }

      const product_id = BigInt(productIdRaw);

      const reviews = await prisma.review.findMany({
        where: { product_id },
        orderBy: { created_at: 'desc' },
      });

      // Calcular promedio
      const total = reviews.length;
      const avg =
        total === 0
          ? 0
          : reviews.reduce((sum, r) => sum + r.rating, 0) / total;

      return res.status(200).json({
        ok: true,
        total,
        average: avg,
        reviews: reviews.map((r) => ({
          review_id: r.review_id.toString(),
          rating: r.rating,
          comentario: r.comentario || '',
          created_at: r.created_at,
        })),
      });
    }

    if (req.method === 'POST') {
      // POST /api/reviews
      // Body: { product_id, rating, comentario }
      const token = getTokenFromReq(req);
      if (!token || !token.email) {
        return res
          .status(401)
          .json({ ok: false, error: 'Debes iniciar sesión para comentar' });
      }

      const { product_id, rating, comentario } = req.body || {};

      if (!product_id || !rating) {
        return res
          .status(400)
          .json({ ok: false, error: 'Faltan product_id o rating' });
      }

      const ratingNum = Number(rating);
      if (
        Number.isNaN(ratingNum) ||
        ratingNum < 1 ||
        ratingNum > 5
      ) {
        return res.status(400).json({
          ok: false,
          error: 'El rating debe ser un número entre 1 y 5',
        });
      }

      // Buscar cliente por correo
      const cliente = await prisma.cliente.findUnique({
        where: { correo: token.email },
      });

      if (!cliente) {
        return res.status(400).json({
          ok: false,
          error: 'Cliente no encontrado para este usuario',
        });
      }

      const nuevo = await prisma.review.create({
        data: {
          product_id: BigInt(product_id),
          customer_id: cliente.customer_id,
          rating: ratingNum,
          comentario: comentario?.trim() || null,
        },
      });

      return res.status(201).json({
        ok: true,
        review_id: nuevo.review_id.toString(),
      });
    }

    return res
      .status(405)
      .json({ ok: false, error: 'Método no permitido' });
  } catch (err) {
    console.error('[reviews] error:', err);
    return res.status(500).json({
      ok: false,
      error: 'Error interno en reviews',
    });
  }
}
