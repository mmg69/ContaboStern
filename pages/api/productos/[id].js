import { toPlain } from '../../../lib/serialize';
import prisma from '../../../lib/server/prisma';

export default async function handler(req, res) {
  try {
    const { id } = req.query || {};
    if (!id) return res.status(400).json({ error: 'id requerido' });

    if (req.method === 'GET') {
      const producto = await prisma.producto.findUnique({
        where: { product_id: BigInt(id) },
      });
      if (!producto) return res.status(404).json({ error: 'No encontrado' });
      return res.status(200).json(toPlain(producto));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('API productos/[id] error:', e);
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
