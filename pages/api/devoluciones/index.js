// pages/api/devoluciones/index.js
import prisma from '../../../lib/server/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  try {
    const { order_id, product_id, cantidad, motivo } = req.body;

    if (!order_id || !product_id || !cantidad) {
      return res.status(400).json({
        ok: false,
        error: 'order_id, product_id y cantidad son requeridos',
      });
    }

    const cantidadNum = Number(cantidad);
    if (!Number.isFinite(cantidadNum) || cantidadNum <= 0) {
      return res.status(400).json({ ok: false, error: 'Cantidad inválida' });
    }

    const orderIdBig = BigInt(order_id);
    const productIdBig = BigInt(product_id);

    // ================== TRANSACCIÓN ==================
    const result = await prisma.$transaction(async (tx) => {
      // 1) Traer pedido con detalle y devoluciones previas
      const pedido = await tx.pedido.findUnique({
        where: { order_id: orderIdBig },
        include: {
          detalle: {
            where: { product_id: productIdBig },
          },
          devolucion: {
            where: { product_id: productIdBig },
          },
        },
      });

      if (!pedido) {
        throw new Error('Pedido no encontrado');
      }

      if (pedido.estado !== 'pagado') {
        throw new Error('Sólo se pueden devolver pedidos pagados');
      }

      const linea = pedido.detalle[0];
      if (!linea) {
        throw new Error('El producto no pertenece a este pedido');
      }

      // cantidad comprada
      const cantidadComprada = Number(linea.cantidad);

      // cantidad ya devuelta para este producto en este pedido
      const yaDevuelto = pedido.devolucion.reduce((sum, d) => {
        return sum + Number(d.cantidad);
      }, 0);

      const maxDisponible = cantidadComprada - yaDevuelto;
      if (cantidadNum > maxDisponible) {
        throw new Error(
          `No puedes devolver más de ${maxDisponible} unidades de este producto`
        );
      }

      // 2) Calcular monto de reembolso
      const precioUnitario = Number(linea.precio_unitario);
      const montoReembolso = precioUnitario * cantidadNum;

      // 3) Insertar registro en DEVOLUCIONES
      const nuevaDev = await tx.devolucion.create({
        data: {
          order_id: pedido.order_id,
          product_id: productIdBig,
          customer_id: pedido.customer_id,
          cantidad: cantidadNum,
          monto_reembolso: montoReembolso,
          motivo: motivo || null,
          estado: 'completada', // o 'en_proceso' si quieres flujo más largo
        },
      });

      // 4) Reponer stock del producto
      await tx.producto.update({
        where: { product_id: productIdBig },
        data: {
          cantidad_stock: {
            increment: cantidadNum,
          },
        },
      });

      // 5) Ajustar total del pedido y estado
      const nuevoTotal = Number(pedido.total) - montoReembolso;
      let nuevoEstado = pedido.estado;

      if (nuevoTotal <= 0) {
        // Todo reembolsado
        nuevoEstado = 'reembolsado_total';
      } else {
        nuevoEstado = 'reembolsado_parcial';
      }

      const pedidoActualizado = await tx.pedido.update({
        where: { order_id: pedido.order_id },
        data: {
          total: nuevoTotal,
          estado: nuevoEstado,
          updated_at: new Date(),
        },
      });

      return {
        devolucion: nuevaDev,
        pedido: pedidoActualizado,
        montoReembolso,
      };
    });

    return res.status(200).json({
      ok: true,
      devolucion_id: String(result.devolucion.return_id),
      order_id: String(result.pedido.order_id),
      nuevo_total: result.pedido.total,
      nuevo_estado: result.pedido.estado,
      monto_reembolso: result.montoReembolso,
    });
  } catch (err) {
    console.error('[devoluciones] error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Error al registrar devolución',
    });
  }
}
