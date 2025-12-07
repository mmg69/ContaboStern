import prisma from '../../../lib/server/prisma';

export default async function handler(req, res) {
  try {
    const { id } = req.query || {};
    if (!id) return res.status(400).json({ error: 'id requerido' });

    if (req.method === 'GET') {
      const pedido = await prisma.pedido.findUnique({
        where: { order_id: BigInt(id) },
        include: { detalle: true, cliente: true },
      });
      if (!pedido) return res.status(404).json({ error: 'No encontrado' });

      const mapped = {
        order_id: Number(pedido.order_id),
        cliente: pedido.cliente?.nombre ?? '—',
        fecha: pedido.fecha,
        estado: pedido.estado,
        items: pedido.detalle?.length ?? 0,
        monto: Number(pedido.total ?? 0),
        detalle: pedido.detalle?.map(d => ({
          order_item_id: Number(d.order_item_id),
          product_id: d.product_id ? Number(d.product_id) : null,
          nombre_producto: d.nombre_producto,
          cantidad: Number(d.cantidad),
          precio_unitario: Number(d.precio_unitario),
          subtotal_linea: Number(d.subtotal_linea),
        })) ?? [],
      };

      return res.status(200).json(mapped);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('API pedidos/[id] error:', e);
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
