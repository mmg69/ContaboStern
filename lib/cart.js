// lib/cart.js
const CART_KEY = 'stern_cart_v1';

// Seguridad al parsear JSON
function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Leer carrito desde localStorage
export function readCart() {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(CART_KEY);
  const data = safeParse(raw);
  if (!Array.isArray(data)) return [];
  return data.map((it) => ({
    product_id: Number(it.product_id),
    nombre: it.nombre || '',
    categoria: it.categoria || '',
    precio: Number(it.precio ?? 0),
    cantidad_stock: Number(it.cantidad_stock ?? 0),
    image_url: it.image_url || '',
    cantidad: Number(it.cantidad ?? 1),
  }));
}

// Escribir carrito completo
export function writeCart(cart) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// Agregar producto (usado desde la página de detalle)
export function addToCart(product, unidades = 1) {
  if (!product) return [];
  const qty = Math.max(1, Number(unidades) || 1);

  const baseItem = {
    product_id: Number(product.product_id),
    nombre: product.nombre,
    categoria: product.categoria ?? '',
    precio: Number(product.precio ?? 0),
    cantidad_stock: Number(product.cantidad_stock ?? 0),
    image_url: (product.image_url || '').trim(),
  };

  const current = readCart();
  const idx = current.findIndex(
    (it) => Number(it.product_id) === Number(baseItem.product_id)
  );

  if (idx === -1) {
    current.push({ ...baseItem, cantidad: qty });
  } else {
    const prev = current[idx];
    const stock = baseItem.cantidad_stock || prev.cantidad_stock || 99;
    const nueva = Math.min((prev.cantidad || 1) + qty, stock);
    current[idx] = { ...prev, ...baseItem, cantidad: nueva };
  }

  writeCart(current);
  return current;
}

// Cambiar cantidad
export function updateCartQuantity(product_id, nuevaCantidad) {
  const qty = Math.max(1, Number(nuevaCantidad) || 1);
  const current = readCart();
  const next = current.map((it) => {
    if (Number(it.product_id) !== Number(product_id)) return it;
    const stock = it.cantidad_stock || 99;
    const safeQty = Math.min(qty, stock);
    return { ...it, cantidad: safeQty };
  });
  writeCart(next);
  return next;
}

// Eliminar producto
export function removeFromCart(product_id) {
  const current = readCart();
  const next = current.filter(
    (it) => Number(it.product_id) !== Number(product_id)
  );
  writeCart(next);
  return next;
}

// (Opcional) Limpiar carrito
export function clearCart() {
  writeCart([]);
  return [];
}
