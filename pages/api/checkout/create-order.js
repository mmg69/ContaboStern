// pages/api/checkout/create-order.js
import prisma from '../../../lib/server/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  try {
    const { customer, items } = req.body || {};

    // --- Validaciones básicas ---
    if (!customer || !customer.nombre || !customer.correo) {
      return res.status(400).json({
        ok: false,
        error: 'Faltan datos mínimos del cliente (nombre, correo).',
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'El carrito está vacío.',
      });
    }

    const nombre = String(customer.nombre).trim();
    const correo = String(customer.correo).trim();
    const telefono = customer.telefono ? String(customer.telefono).trim() : null;
    const ciudad = customer.ciudad ? String(customer.ciudad).trim() : null;
    const region = customer.region ? String(customer.region).trim() : null;
    const pais = customer.pais ? String(customer.pais).trim() : null;

    const result = await prisma.$transaction(async (tx) => {
      // 1) Buscar / crear cliente por correo
      let dbCliente = await tx.cliente.findFirst({
        where: { correo },
      });

      if (!dbCliente) {
        dbCliente = await tx.cliente.create({
          data: {
            nombre,
            correo,
            telefono,
            ciudad,
            region,
            pais,
            activo: true,
            fecha_alta: new Date(),
          },
        });
      }

      // 2) Cargar productos del carrito desde la BD
      const productIds = items
        .map((it) => Number(it.product_id))
        .filter((id) => Number.isFinite(id));

      if (!productIds.length) {
        throw new Error('No hay product_id válidos en el carrito.');
      }

      const productos = await tx.producto.findMany({
        where: {
          product_id: { in: productIds.map((id) => BigInt(id)) },
          activo: true,
        },
      });

      const mapProd = new Map(
        productos.map((p) => [Number(p.product_id), p])
      );

      let subtotalAcumulado = 0;
      const lineas = [];

      for (const it of items) {
        const pid = Number(it.product_id);
        const cant = Math.max(1, Number(it.cantidad || 1));

        const prod = mapProd.get(pid);
        if (!prod) {
          // Producto no existe o está inactivo → lo saltamos
          continue;
        }

        const precio = Number(prod.precio);
        const subtotalLinea = precio * cant;
        subtotalAcumulado += subtotalLinea;

        lineas.push({
          product_id: prod.product_id,             // BigInt
          nombre_producto: prod.nombre,
          cantidad: cant,
          precio_unitario: precio,
          descuento: 0,
          subtotal_linea: subtotalLinea,
        });
      }

      if (!lineas.length) {
        throw new Error(
          'No se pudo crear el pedido: ningún producto del carrito es válido o activo.'
        );
      }

      const descuento = 0;
      const envio = 0;
      const total = subtotalAcumulado - descuento + envio;

      // 3) Crear pedido con detalle
      const pedido = await tx.pedido.create({
        data: {
          customer_id: dbCliente.customer_id,   // BigInt
          fecha: new Date(),
          estado: 'pendiente',                 // luego lo pasaremos a "pagado"
          moneda: 'MXN',
          subtotal: subtotalAcumulado,
          descuento,
          envio,
          total,
          detalle: {
            create: lineas,
          },
        },
        include: {
          detalle: true,
        },
      });

      return { pedido, cliente: dbCliente };
    });

    return res.status(200).json({
      ok: true,
      order_id: Number(result.pedido.order_id),
      total: Number(result.pedido.total),
      moneda: result.pedido.moneda,
      customer_id: Number(result.cliente.customer_id),
    });
  } catch (err) {
    console.error('[checkout/create-order] error', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Error al crear pedido',
    });
  }
}
