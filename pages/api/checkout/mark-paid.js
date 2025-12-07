// pages/api/checkout/mark-paid.js
import prisma from '../../../lib/server/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  try {
    const { order_id, paypal_txn_id, paypal_status, paypal_raw } = req.body;
    console.log('[mark-paid] body:', req.body);

    if (!order_id) {
      return res.status(400).json({ ok: false, error: 'Falta order_id' });
    }

    const idBigInt = BigInt(order_id);

    const updated = await prisma.pedido.update({
      where: { order_id: idBigInt },
      data: {
        estado: 'pagado',
        metodo_pago: 'paypal',
        paypal_txn_id: paypal_txn_id || null,
        paypal_status: paypal_status || 'COMPLETED',
        paypal_raw: paypal_raw || null,
        updated_at: new Date(),
      },
    });

    console.log('[mark-paid] updated row:', updated);

    return res.status(200).json({
      ok: true,
      order_id: String(updated.order_id),
      estado: updated.estado,
    });
  } catch (err) {
    console.error('[mark-paid] error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Error al marcar pedido como pagado',
    });
  }
}
