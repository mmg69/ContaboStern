// /lib/products.js
// /lib/products.js
import prisma from './server/prisma';

// Utilidad para convertir BigInt a Number / JSON
function toPlain(d) {
  return JSON.parse(
    JSON.stringify(d, (_, v) => (typeof v === 'bigint' ? Number(v) : v))
  );
}

/**
 * Productos destacados para la home o secciones de recomendados.
 * Ajusta el where según tu modelo (campo "destacado", categoría, etc.)
 */
export async function fetchFeaturedProducts(limit = 8) {
  const rows = await prisma.producto.findMany({
    // Si tienes un campo "destacado" en la BD, puedes usar esto:
    // where: { destacado: true },
    orderBy: { created_at: 'desc' },
    take: limit,
  });

  return toPlain(rows);
}

/**
 * Obtener un producto por id (para detalle, API, etc.)
 */
export async function fetchProductById(productId) {
  const row = await prisma.producto.findUnique({
    where: { product_id: BigInt(productId) },
  });

  return row ? toPlain(row) : null;
}

/**
 * Para getStaticPaths: devolver ids disponibles
 */
export async function fetchProductIds(limit = 50) {
  const rows = await prisma.producto.findMany({
    select: { product_id: true },
    orderBy: { created_at: 'desc' },
    take: limit,
  });

  const plain = toPlain(rows);
  return plain.map((p) => String(p.product_id));
}

/*
export async function fetchProducts() {
  // Aquí podrías llamar a tu BD
  return PRODUCTS;
}Stenr

export async function fetchProductById(id) {
  // Aquí podrías llamar a tu BD
  return PRODUCTS.find(p => p.id === id) || null;
}

export async function fetchProductIds() {
  // Para getStaticPaths
  const all = await fetchProducts();
  return all.map(p => p.id);
}
*/