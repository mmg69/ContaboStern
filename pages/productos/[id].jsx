// pages/productos/[id].jsx
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import SiteHeader from '../../components/SiteHeader';
import CatalogBar from '../../components/CatalogBar';
import styles from '../../styles/ProductDetail.module.css';
import { addToCart } from '../../lib/cart';
import { getProductImage } from '../../lib/images'; // 👈 usar el mismo helper
import ProductReviews from '../../components/ProductReviews';

const STORAGE_KEY = 'stern_cart_v1'; // 👈 misma clave que usas en el carrito

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function toPlain(d) {
  return JSON.parse(
    JSON.stringify(d, (_, v) => (typeof v === 'bigint' ? Number(v) : v))
  );
}

// 🔹 Botón de carrito con contador
function CartButton() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    function updateCount() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const data = safeParse(raw) || [];
        const total = Array.isArray(data)
          ? data.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0)
          : 0;
        setCount(total);
      } catch {
        setCount(0);
      }
    }

    updateCount(); // al montar

    // actualizar cuando el carrito cambie
    window.addEventListener('cart-updated', updateCount);
    return () => window.removeEventListener('cart-updated', updateCount);
  }, []);

  return (
    <Link href="/carrito" className={styles.cartBtn} aria-label="Carrito">
      <span className={styles.cartIcon}>🛒</span>
      {count > 0 && (
        <span className={styles.cartCount}>
          {count}
        </span>
      )}
    </Link>
  );
}

export default function ProductoDetalle({ product }) {
  if (!product) return <main className={styles.container}>Producto no encontrado.</main>;

  // ✅ MISMA lógica de imagen que Featured y Categoría
  const imgSrc = getProductImage(product);

  const stock = Number(product.cantidad_stock ?? 0);
  const [qty, setQty] = useState(() => (stock > 0 ? 1 : 0));
  const rating = Number(product.rating ?? 4.2);
  const total = Number(product.precio ?? 0) * qty;

  const handleAddToCart = () => {
    try {
      const payload = {
        product_id: product.product_id,
        nombre: product.nombre,
        categoria: product.categoria,
        precio: product.precio,
        cantidad_stock: product.cantidad_stock,
        image_url: product.image_url,
      };

      const next = addToCart(payload, qty);
      console.log('Carrito actualizado:', next);
      window.dispatchEvent(new Event('cart-updated')); // 👈 importantísimo para refrescar el número

    } catch (e) {
      console.error('Error al agregar al carrito', e);
    }
  };

  return (
    <div className={styles.wrapper}>
      <Head>
        <title>{`${product.nombre} | STERN`}</title>
        <meta name="description" content={`Comprar ${product.nombre} en STERN`} />
      </Head>

      <SiteHeader />
      <CatalogBar />

      <main className={styles.container}>
        {/* Fila superior: back + botón de carrito */}
        <div className={styles.topBar}>
          <Link href="/" className={styles.backLink}>← Volver</Link>
          <CartButton /> {/* 👈 aquí aparece el botón con número */}
        </div>

        <div className={`${styles.card} ${styles.grid}`}>
          {/* === Imagen principal === */}
          <div className={styles.imageBox}>
            <img
              src={imgSrc}
              alt={product.nombre}
              className={styles.imageInner}
              loading="lazy"
              onError={(e) => {
                if (!e.currentTarget.dataset.fallbackApplied) {
                  e.currentTarget.dataset.fallbackApplied = '1';
                  e.currentTarget.src = '/products/placeholder.png'; // o .jpg, como tengas tu placeholder
                }
              }}
            />
          </div>

          {/* === Información del producto === */}
          <div>
            <h1 className={styles.title}>{product.nombre}</h1>
            <p className={styles.meta}>
              • {product.categoria}
            </p>

            <p className={styles.price}>
              {Number(product.precio ?? 0).toLocaleString('es-MX', {
                style: 'currency',
                currency: 'MXN',
                minimumFractionDigits: 2,
              })}
            </p>

            <p className={`${styles.stock} ${product.cantidad_stock > 0 ? styles.stockOk : styles.stockNo}`}>
              {product.cantidad_stock > 0 ? `Disponible (${product.cantidad_stock} en stock)` : 'Sin stock'}
            </p>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Detalles</h2>
              <ul className={styles.kv}>
                <li>Categoría: {product.categoria}</li>
                <li>
                  Valoración:&nbsp;
                  <span style={{ color: '#f59e0b' }} aria-hidden>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>{i < Math.floor(rating) ? '★' : '☆'}</span>
                    ))}
                  </span>
                  &nbsp;<small style={{ color: '#6b7280' }}>{rating.toFixed(1)} / 5</small>
                </li>
                <li>
                  Cantidad:
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
                    <button onClick={() => setQty(q => Math.max(0, q - 1))} disabled={qty <= 0} className={styles.btnGhost}>−</button>
                    <input
                      type="number"
                      value={qty}
                      min={0}
                      max={stock}
                      onChange={(e) => {
                        const v = Number(e.target.value || 0);
                        if (!Number.isFinite(v)) return;
                        setQty(Math.max(0, Math.min(stock, Math.floor(v))));
                      }}
                      style={{ width: '4rem', textAlign: 'center' }}
                    />
                    <button onClick={() => setQty(q => Math.min(stock, q + 1))} disabled={qty >= stock} className={styles.btnGhost}>＋</button>
                  </div>
                </li>
                <li>Stock actual: {stock}</li>
                <li>Total aproximado: <strong>{total.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</strong></li>
              </ul>
              <div className={styles.actions}>
                <button
                  className={styles.btnPrimary}
                  type="button"
                  onClick={handleAddToCart}
                  disabled={stock <= 0 || qty <= 0}>Agregar al carrito</button>
              </div>
            </section>
          </div>
        </div>
      </main>
      <ProductReviews productId={product.product_id} />

    </div>
  );
}

// Usar SSR y API interna en lugar de consultas directas a Prisma desde el frontend
export async function getServerSideProps({ params, req }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return { notFound: true };

  try {
    const proto = req.headers['x-forwarded-proto'] || (req.headers.referer && req.headers.referer.startsWith('https') ? 'https' : 'http');
    const host = req.headers.host;
    const base = `${proto}://${host}`;

    const apiRes = await fetch(`${base}/api/productos/${id}`);
    if (!apiRes.ok) return { notFound: true };
    const product = await apiRes.json().catch(() => null);

    if (!product) return { notFound: true };

    return { props: { product } };
  } catch (err) {
    console.error('Error fetching product via API:', err);
    return { notFound: true };
  }
}
