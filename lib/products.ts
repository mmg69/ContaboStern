import {prisma} from "./server/prisma";

function shapeProduct(p: any) {
  return {
    id: String(p.product_id),
    name: p.nombre,
    category: p.categoria,
    price: Number(p.precio),               // Decimal → number
    discount: p.descuento ?? "0%",
    rating: p.rating != null ? Number(p.rating) : 4.6,
    img: p.img_url ?? "/placeholder.png",
    description: p.descripcion ?? "",
    activo: Boolean(p.activo),
    cantidad_stock: Number(p.cantidad_stock ?? 0),
  };
}

export async function fetchProductsForListing() {
  const rows = await prisma.producto.findMany({
    orderBy: { product_id: "desc" },
    take: 200,
  });
  return rows.map(shapeProduct);
}

export async function fetchProductIds() {
  const rows = await prisma.producto.findMany({
    select: { product_id: true },
    orderBy: { product_id: "desc" },
    take: 200,
  });
  return rows.map(r => String(r.product_id));
}

export async function fetchProductById(id: string) {
  const row = await prisma.producto.findUnique({
    where: { product_id: BigInt(id) },
  });
  return row ? shapeProduct(row) : null;
}
