// pages/api/stats.js
import { toPlain } from '../../lib/serialize';

import prisma from '../../lib/server/prisma';
export default async function handler(_req, res) {
  try {
    const [totalUsuarios, totalProductos, totales] = await Promise.all([
      prisma.cliente.count(),
      prisma.producto.count(),
      prisma.pedido.aggregate({
        _sum: { total: true },
        _count: { order_id: true },
      }),
    ]);

    return res.status(200).json({
      totalUsuarios,
      totalProductos,
      totalPedidos: totales._count.order_id ?? 0,
      totalIngresos: Number(totales._sum.total ?? 0),
    });
  } catch (e) {
    console.error('API stats error:', e);
    return res.status(500).json({ error: e?.message || 'Error' });
  }
}
