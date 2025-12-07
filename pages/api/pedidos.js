// pages/api/pedidos.js
import { toPlain } from '../../lib/serialize';

import prisma from '../../lib/server/prisma';
export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const pedidos = await prisma.pedido.findMany({
        orderBy: { created_at: 'desc' },
        include: { detalle: true, cliente: true },
      });

      const mapped = pedidos.map((p) => ({
        order_id: Number(p.order_id),
        cliente: p.cliente?.nombre ?? '—',
        fecha: p.fecha,
        estado: p.estado,
        items: p.detalle?.length ?? 0,
        monto: Number(p.total ?? 0),
        detalle: p.detalle?.map(d => ({
          order_item_id: Number(d.order_item_id),
          product_id: Number(d.product_id),
          nombre_producto: d.nombre_producto,
          cantidad: Number(d.cantidad),
          precio_unitario: Number(d.precio_unitario),
          subtotal_linea: Number(d.subtotal_linea),
        })) ?? [],
      }));

      return res.status(200).json(mapped);
    }

    if (req.method === 'POST') {
      const { customer_id, estado = 'pagado', items = [] } = req.body ?? {};
      if (!customer_id || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'customer_id e items requeridos' });
      }

      const products = await prisma.producto.findMany({
        where: { product_id: { in: items.map((i) => BigInt(i.product_id)) } },
      });

      let subtotal = 0;
      const detalles = items.map((i) => {
        const pr = products.find(p => Number(p.product_id) === Number(i.product_id));
        if (!pr) throw new Error(`Producto ${i.product_id} no encontrado`);
        if (pr.cantidad_stock < i.cantidad) throw new Error(`Stock insuficiente para ${pr.nombre}`);
        const line = Number(pr.precio) * Number(i.cantidad);
        subtotal += line;
        return {
          product_id: pr.product_id,
          nombre_producto: pr.nombre,
          cantidad: i.cantidad,
          precio_unitario: pr.precio,
          descuento: 0,
          subtotal_linea: line,
        };
      });

      const envio = 0;
      const descuento = 0;
      const total = subtotal - descuento + envio;

      const created = await prisma.$transaction(async (tx) => {
        const pedido = await tx.pedido.create({
          data: {
            customer_id: BigInt(customer_id),
            estado,
            subtotal,
            descuento,
            envio,
            total,
          },
        });

        await Promise.all(
          detalles.map(d => tx.detallePedido.create({ data: { ...d, order_id: pedido.order_id } }))
        );

        await Promise.all(
          items.map(i =>
            tx.producto.update({
              where: { product_id: BigInt(i.product_id) },
              data: { cantidad_stock: { decrement: Number(i.cantidad) } },
            })
          )
        );

        return pedido;
      });

      return res.status(201).json({ order_id: Number(created.order_id) });
    }

    // EDITAR VENTA
    if (req.method === 'PATCH') {
      const { order_id, estado, items } = req.body ?? {};
      if (!order_id) return res.status(400).json({ error: 'order_id requerido' });

      const updated = await prisma.$transaction(async (tx) => {
        const pedidoActual = await tx.pedido.findUnique({
          where: { order_id: BigInt(order_id) },
          include: { detalle: true },
        });
        if (!pedidoActual) throw new Error('Pedido no existe');

        // Si envían items nuevos, recalcular y ajustar stock
        if (Array.isArray(items)) {
          // Restituir stock de lo anterior
          await Promise.all(
            pedidoActual.detalle.map((d) =>
              tx.producto.update({
                where: { product_id: d.product_id },
                data: { cantidad_stock: { increment: Number(d.cantidad) } },
              })
            )
          );

          // Validar nuevos items
          const products = await tx.producto.findMany({
            where: { product_id: { in: items.map((i) => BigInt(i.product_id)) } },
          });

          let subtotal = 0;
          const nuevosDetalles = items.map((i) => {
            const pr = products.find(p => Number(p.product_id) === Number(i.product_id));
            if (!pr) throw new Error(`Producto ${i.product_id} no encontrado`);
            if (pr.cantidad_stock < i.cantidad) throw new Error(`Stock insuficiente para ${pr.nombre}`);
            const line = Number(pr.precio) * Number(i.cantidad);
            subtotal += line;
            return {
              product_id: pr.product_id,
              nombre_producto: pr.nombre,
              cantidad: i.cantidad,
              precio_unitario: pr.precio,
              descuento: 0,
              subtotal_linea: line,
            };
          });

          const envio = 0;
          const descuento = 0;
          const total = subtotal - descuento + envio;

          // Reemplazar detalle
          await tx.detallePedido.deleteMany({ where: { order_id: BigInt(order_id) } });
          await Promise.all(
            nuevosDetalles.map(d =>
              tx.detallePedido.create({ data: { ...d, order_id: BigInt(order_id) } })
            )
          );

          // Descontar stock nuevo
          await Promise.all(
            items.map(i =>
              tx.producto.update({
                where: { product_id: BigInt(i.product_id) },
                data: { cantidad_stock: { decrement: Number(i.cantidad) } },
              })
            )
          );

          // Actualizar cabecera
          const pedidoUpd = await tx.pedido.update({
            where: { order_id: BigInt(order_id) },
            data: { estado: estado ?? pedidoActual.estado, subtotal, descuento, envio, total, updated_at: new Date() },
            include: { detalle: true, cliente: true },
          });

          return pedidoUpd;
        } else {
          // Solo estado
          const pedidoUpd = await tx.pedido.update({
            where: { order_id: BigInt(order_id) },
            data: { estado: estado ?? pedidoActual.estado, updated_at: new Date() },
            include: { detalle: true, cliente: true },
          });
          return pedidoUpd;
        }
      });

      return res.status(200).json({
        order_id: Number(updated.order_id),
        estado: updated.estado,
        subtotal: Number(updated.subtotal ?? 0),
        total: Number(updated.total ?? 0),
        items: updated.detalle.length,
      });
    }

    // ELIMINAR VENTA (restituye stock)
    if (req.method === 'DELETE') {
      const { order_id } = req.body ?? {};
      if (!order_id) return res.status(400).json({ error: 'order_id requerido' });

      await prisma.$transaction(async (tx) => {
        const pedido = await tx.pedido.findUnique({
          where: { order_id: BigInt(order_id) },
          include: { detalle: true },
        });
        if (!pedido) throw new Error('Pedido no existe');

        // Restituir stock
        await Promise.all(
          pedido.detalle.map((d) =>
            tx.producto.update({
              where: { product_id: d.product_id },
              data: { cantidad_stock: { increment: Number(d.cantidad) } },
            })
          )
        );

        // Borrar detalle y pedido
        await tx.detallePedido.deleteMany({ where: { order_id: BigInt(order_id) } });
        await tx.pedido.delete({ where: { order_id: BigInt(order_id) } });
      });

      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (e) {
    console.error('API pedidos error:', e);
    return res.status(500).json({ error: e?.message || 'Error del servidor' });
  }
}
