// pages/api/etl-snapshot.js
import prisma from '../../lib/server/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    // ========== 1) DIM_CLIENTE ==========
    // Carga clientes activos desde stern_app.clientes
    // Evita duplicados comparando por nombre+ciudad+región+país+correo
    const insertedClientes = await prisma.$executeRawUnsafe(`
      INSERT INTO temp.dim_cliente (
        nombre,
        ciudad,
        region,
        pais,
        correo,
        fecha_alta,
        activo
      )
      SELECT
        c.nombre,
        c.ciudad,
        c.region,
        c.pais,
        c.correo,
        c.fecha_alta::date,
        c.activo
      FROM stern_app.clientes c
      WHERE c.activo = TRUE
        AND NOT EXISTS (
          SELECT 1
          FROM temp.dim_cliente d
          WHERE d.nombre              = c.nombre
            AND COALESCE(d.ciudad,'') = COALESCE(c.ciudad,'')
            AND COALESCE(d.region,'') = COALESCE(c.region,'')
            AND COALESCE(d.pais,  '') = COALESCE(c.pais,'')
            AND COALESCE(d.correo,'') = COALESCE(c.correo,'')
        )
    `);

    // ========== 2) DIM_PRODUCTO ==========
    // Productos activos, evitando duplicados por nombre+categoria+precio
    const insertedProductos = await prisma.$executeRawUnsafe(`
      INSERT INTO temp.dim_producto (
        nombre,
        categoria,
        precio,
        activo
      )
      SELECT
        p.nombre,
        p.categoria,
        p.precio,
        p.activo
      FROM stern_app.productos p
      WHERE p.activo = TRUE
        AND NOT EXISTS (
          SELECT 1
          FROM temp.dim_producto d
          WHERE d.nombre = p.nombre
            AND COALESCE(d.categoria, '') = COALESCE(p.categoria, '')
            AND d.precio = p.precio
        )
    `);

    // ========== 3) DIM_FECHA ==========
    // Fechas distintas de todos los pedidos
    const insertedFechas = await prisma.$executeRawUnsafe(`
      INSERT INTO temp.dim_fecha (
        fecha,
        anio,
        mes,
        dia,
        trimestre,
        nombre_mes,
        nombre_dia,
        es_fin_de_semana
      )
      SELECT DISTINCT
        p.fecha::date                                AS fecha,
        EXTRACT(YEAR    FROM p.fecha)::int          AS anio,
        EXTRACT(MONTH   FROM p.fecha)::int          AS mes,
        EXTRACT(DAY     FROM p.fecha)::int          AS dia,
        EXTRACT(QUARTER FROM p.fecha)::int          AS trimestre,
        TO_CHAR(p.fecha, 'TMMonth')                 AS nombre_mes,
        TO_CHAR(p.fecha, 'TMDay')                   AS nombre_dia,
        CASE
          WHEN EXTRACT(ISODOW FROM p.fecha) IN (6, 7) THEN TRUE
          ELSE FALSE
        END                                         AS es_fin_de_semana
      FROM stern_app.pedidos p
      WHERE NOT EXISTS (
        SELECT 1
        FROM temp.dim_fecha d
        WHERE d.fecha = p.fecha::date
      )
    `);

    // ========== 4) FACT_VENTAS ==========
    // Para simplificar: limpiamos fact_ventas y recargamos TODO
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE temp.fact_ventas RESTART IDENTITY`);

    const insertedVentas = await prisma.$executeRawUnsafe(`
      INSERT INTO temp.fact_ventas (
        id_cliente_sk,
        id_producto_sk,
        id_fecha_sk,
        cantidad,
        precio_unitario,
        subtotal,
        descuento,
        envio,
        total,
        estado,
        moneda
      )
      SELECT
        dc.id_cliente_sk,
        dp.id_producto_sk,
        df.id_fecha_sk,
        dped.cantidad::numeric,
        dped.precio_unitario,
        dped.subtotal_linea,
        ped.descuento,
        ped.envio,
        ped.total,
        ped.estado,
        ped.moneda
      FROM stern_app.pedidos ped
      JOIN stern_app.detalle_pedido dped
        ON dped.order_id = ped.order_id
      JOIN stern_app.clientes cli
        ON cli.customer_id = ped.customer_id
      JOIN stern_app.productos prod
        ON prod.product_id = dped.product_id
      JOIN temp.dim_cliente dc
        ON dc.nombre              = cli.nombre
       AND COALESCE(dc.ciudad, '') = COALESCE(cli.ciudad, '')
       AND COALESCE(dc.region, '') = COALESCE(cli.region, '')
       AND COALESCE(dc.pais,   '') = COALESCE(cli.pais, '')
       AND COALESCE(dc.correo, '') = COALESCE(cli.correo, '')
      JOIN temp.dim_producto dp
        ON dp.nombre               = prod.nombre
       AND COALESCE(dp.categoria, '') = COALESCE(prod.categoria, '')
       AND dp.precio              = prod.precio
      JOIN temp.dim_fecha df
        ON df.fecha = ped.fecha::date
    `);

    return res.status(200).json({
      ok: true,
      message: `ETL ejecutado. Dim Cliente: ${insertedClientes}, Dim Producto: ${insertedProductos}, Dim Fecha: ${insertedFechas}, Filas en fact_ventas: ${insertedVentas}.`,
    });
  } catch (e) {
    console.error('[ETL] error:', e);
    return res.status(500).json({
      ok: false,
      error: e.message || 'Error al ejecutar ETL',
    });
  }
}
