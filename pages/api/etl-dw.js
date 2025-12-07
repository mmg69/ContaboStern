// pages/api/etl-dw.js
import prisma from '../../lib/server/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  try {
const insertedClientes = await prisma.$executeRawUnsafe(`
  INSERT INTO dw.dim_clientes (
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
    c.fecha_alta,
    c.activo
  FROM temp.dim_cliente AS c
  LEFT JOIN dw.dim_clientes AS d
    ON d.nombre              = c.nombre
   AND COALESCE(d.ciudad,  '') = COALESCE(c.ciudad,  '')
   AND COALESCE(d.region, '') = COALESCE(c.region, '')
   AND COALESCE(d.pais,   '') = COALESCE(c.pais,   '')
   AND COALESCE(d.correo, '') = COALESCE(c.correo, '')
   AND d.fecha_alta IS NOT DISTINCT FROM c.fecha_alta
  WHERE d.id_cliente_sk IS NULL;
`);


    // ========== 2) DIM_PRODUCTO: temp.dim_producto -> dw.dim_producto ==========
    const insertedProductos = await prisma.$executeRawUnsafe(`
      INSERT INTO dw.dim_producto (
        nombre,
        categoria,
        precio
      )
      SELECT
        p.nombre,
        p.categoria,
        p.precio
      FROM temp.dim_producto AS p
      LEFT JOIN dw.dim_producto AS d
        ON d.nombre    = p.nombre
       AND d.categoria = p.categoria
       AND d.precio    = p.precio
      WHERE d.id_producto_sk IS NULL;
    `);

    // ========== 3) DIM_FECHA: temp.dim_fecha -> dw.dim_fecha ==========
    const insertedFechas = await prisma.$executeRawUnsafe(`
      INSERT INTO dw.dim_fecha (
        fecha,
        anio,
        mes,
        dia,
        trimestre
      )
      SELECT
        f.fecha,
        f.anio,
        f.mes,
        f.dia,
        f.trimestre
      FROM temp.dim_fecha AS f
      LEFT JOIN dw.dim_fecha AS d
        ON d.fecha = f.fecha
      WHERE d.id_fecha_sk IS NULL;
    `);

    // ========== 4) FACT_VENTAS: temp.fact_ventas -> dw.fact_ventas ==========
    const insertedFact = await prisma.$executeRawUnsafe(`
      INSERT INTO dw.fact_ventas (
        id_cliente_sk,
        id_producto_sk,
        id_fecha_sk,
        cantidad,
        total_venta
      )
      SELECT
        dc.id_cliente_sk,
        dp.id_producto_sk,
        df.id_fecha_sk,
        fv.cantidad,
        fv.total
      FROM temp.fact_ventas AS fv
      -- join a dimensiones en temp
      JOIN temp.dim_cliente  AS c
        ON c.id_cliente_sk = fv.id_cliente_sk
      JOIN temp.dim_producto AS p
        ON p.id_producto_sk = fv.id_producto_sk
      JOIN temp.dim_fecha    AS f
        ON f.id_fecha_sk = fv.id_fecha_sk
      -- mapear a SK de dimensiones en DW por atributos
      JOIN dw.dim_clientes AS dc
        ON dc.nombre            = c.nombre
       AND COALESCE(dc.ciudad,'') = COALESCE(c.ciudad,'')
       AND COALESCE(dc.region,'') = COALESCE(c.region,'')
       AND COALESCE(dc.pais,'')   = COALESCE(c.pais,'')
      JOIN dw.dim_producto AS dp
        ON dp.nombre    = p.nombre
       AND dp.categoria = p.categoria
       AND dp.precio    = p.precio
      JOIN dw.dim_fecha AS df
        ON df.fecha = f.fecha
      -- evitar duplicados en fact_ventas de DW
      LEFT JOIN dw.fact_ventas AS f2
        ON f2.id_cliente_sk  = dc.id_cliente_sk
       AND f2.id_producto_sk = dp.id_producto_sk
       AND f2.id_fecha_sk    = df.id_fecha_sk
       AND f2.cantidad       = fv.cantidad
       AND f2.total_venta    = fv.total
      WHERE f2.id_fact_venta IS NULL;
    `);

    return res.status(200).json({
      ok: true,
      clientes: Number(insertedClientes) || 0,
      productos: Number(insertedProductos) || 0,
      fechas: Number(insertedFechas) || 0,
      ventas: Number(insertedFact) || 0,
    });
  } catch (err) {
    console.error('[DW ETL] error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Error en ETL temp -> dw',
    });
  }
}
