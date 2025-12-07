// components/FeaturedProducts.jsx
import Link from 'next/link';
import { getProductImage } from '../lib/images';

// ===================== Helpers de carrito (localStorage) =====================
const STORAGE_KEY = 'stern_cart_v1';

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function loadCart() {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  const data = safeParse(raw);
  return Array.isArray(data) ? data : [];
}

function saveCart(cart) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

function addToCart(product, cantidad = 1) {
  if (!product || typeof window === 'undefined') return;

  const cart = loadCart();
  const id = Number(product.product_id ?? product.id);
  if (!id) return;

  const idx = cart.findIndex((item) => Number(item.product_id) === id);

  if (idx >= 0) {
    // Ya existe en el carrito → sumar cantidad
    const current = cart[idx];
    const nuevaCantidad = Number(current.cantidad || 0) + Number(cantidad || 1);
    cart[idx] = { ...current, cantidad: nuevaCantidad };
  } else {
    // Nuevo producto
    cart.push({
      product_id: id,
      nombre: product.nombre || product.name || '',
      categoria: product.categoria || product.category || '',
      precio: Number(product.precio ?? product.price ?? 0),
      image_url: product.image_url || product.img || null,
      cantidad: Number(cantidad || 1),
      stock: Number(product.cantidad_stock ?? product.stock ?? 999),
    });
  }

  saveCart(cart);
}

// ⭐ Componente de estrellas
function Stars({ value = 4.5 }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  const full = Math.floor(v);
  const half = v - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  return (
    <div style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }} aria-label={`Rating ${v} de 5`}>
      {Array.from({ length: full }).map((_, i) => (
        <span key={`f${i}`} style={{ color: '#f59e0b' }}>★</span>
      ))}
      {half ? <span style={{ color: '#f59e0b' }}>☆</span> : null}
      {Array.from({ length: empty }).map((_, i) => (
        <span key={`e${i}`} style={{ color: '#d1d5db' }}>★</span>
      ))}
      <span style={{ color: '#6b7280', fontSize: 12, marginLeft: 6 }}>{v.toFixed(1)}</span>
    </div>
  );
}

// 💰 Formateador de precios
function formatMoney(n) {
  return Number(n ?? 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  });
}

// 📦 Lógica para descuentos
function usePrice(p) {
  const precio = Number(p.precio ?? 0);
  const descuento = Number(p.descuento ?? 0);

  if (descuento > 0 && descuento < 100) {
    const final = Math.max(0, precio * (1 - descuento / 100));
    return {
      hasDiscount: true,
      original: precio,
      final,
      badge: `-${descuento}%`,
    };
  }

  return { hasDiscount: false, original: precio, final: precio, badge: null };
}

// 🧱 Componente principal
export default function FeaturedProducts({ items = [] }) {
  if (!items.length) return null;

  function handleAddToCart(p, e) {
    // Por si el botón llega a estar dentro de algo clickeable
    e.preventDefault();
    e.stopPropagation?.();

    addToCart(p, 1);
    alert(`"${p.nombre}" se agregó al carrito.`);
  }

  return (
    <section style={{ padding: '2rem' }}>
      <h2
        style={{
          fontSize: '1.8rem',
          fontWeight: 800,
          color: '#1f2937',
          textAlign: 'center',
          marginBottom: '2rem',
        }}
      >
        Productos Recomendados
      </h2>

      <ul
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)', // Exactamente 4 columnas
          gap: '1.5rem',
          listStyle: 'none',
          padding: 0,
          margin: 0,
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        {items.map((p) => {
          const img = getProductImage(p);
          const href = `/productos/${p.product_id}`;
          const rating = p.rating ?? 4.5;
          const { hasDiscount, original, final, badge } = usePrice(p);

          return (
            
            <li
              key={p.product_id}
              style={{
                background: '#fff',
                borderRadius: '0.75rem',
                boxShadow: '0 4px 8px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                position: 'relative',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              {/* 🏷 Categoría */}
              {p.categoria && (
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    background: '#ffffffcc',
                    border: '1px solid #e5e7eb',
                    borderRadius: 9999,
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#1f2937',
                  }}
                >
                  {p.categoria}
                
                </div>
              )}

              {/* 🔻 Descuento */}
              {hasDiscount && badge && (
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: '#dc2626',
                    color: '#fff',
                    borderRadius: 8,
                    padding: '4px 8px',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {badge}
                </div>
              )}

              {/* Bloque clickeable que lleva al detalle */}
              <Link
                href={href}
                style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
              >
                {/* 🖼 Imagen */}
                <div
                  style={{
                    aspectRatio: '4/3',
                    overflow: 'hidden',
                    background: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={img}
                    alt={p.nombre}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease',
                    }}
                    onError={(e) => (e.currentTarget.src = '/products/placeholder.jpg')}
                  />
                </div>

                {/* 📋 Info */}
                <div style={{ padding: '1rem', textAlign: 'center' }}>
                  <h3
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      marginBottom: '0.5rem',
                      color: '#111827',
                    }}
                  >
                    {p.nombre}
                  </h3>

                  <Stars value={rating} />

                  <div style={{ marginTop: 8 }}>
                    {hasDiscount ? (
                      <div>
                        <span style={{ color: '#9ca3af', textDecoration: 'line-through', marginRight: 8 }}>
                          {formatMoney(original)}
                        </span>
                        <span style={{ fontWeight: 800, color: '#2563eb', fontSize: '1.05rem' }}>
                          {formatMoney(final)}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontWeight: 800, color: '#2563eb', fontSize: '1.05rem' }}>
                        {formatMoney(final)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
