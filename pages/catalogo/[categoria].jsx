// pages/catalogo/[categoria].jsx
import { useState, useMemo } from 'react';
// data fetched from internal API instead of direct DB
import SiteHeader from '../../components/SiteHeader';
import CatalogBar from '../../components/CatalogBar';
import styles from '../../styles/ProductDetail.module.css';
import { slugify } from '../../lib/slugify';
import { getProductImage } from '../../lib/images';

// NOTE: data comes from `/api/productos` (already serialized)
function Stars({ value = 4.5 }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  const full = Math.floor(v);
  const half = v - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  return (
    <div className={styles.stars} aria-label={`Calificación ${v.toFixed(1)} de 5`}>
      {Array.from({ length: full }).map((_, i) => (
        <span key={`f${i}`}>★</span>
      ))}
      {half ? <span key="half">☆</span> : null}
      {Array.from({ length: empty }).map((_, i) => (
        <span key={`e${i}`}>★</span>
      ))}
      <span className={styles.starsValue}>{v.toFixed(1)}</span>
    </div>
  );
}


export default function Catalogo({ categoria, items }) {
  // 👇 asegurarnos de que siempre sea un array
  const baseItems = Array.isArray(items) ? items : [];

  // === Estado de filtros ===
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');

  // Rango global de precios (para placeholders)
  const { priceMinGlobal, priceMaxGlobal } = useMemo(() => {
    if (!baseItems.length) return { priceMinGlobal: 0, priceMaxGlobal: 0 };
    const precios = baseItems
      .map((p) => Number(p.precio ?? 0))
      .filter((n) => !isNaN(n));
    if (!precios.length) return { priceMinGlobal: 0, priceMaxGlobal: 0 };

    return {
      priceMinGlobal: Math.min(...precios),
      priceMaxGlobal: Math.max(...precios),
    };
  }, [baseItems]);

  // Aplicar filtros
  const filteredItems = useMemo(() => {
    return baseItems.filter((p) => {
      const nombre = (p.nombre || '').toLowerCase();
      const rating = Number(p.rating ?? 0);
      const precio = Number(p.precio ?? 0);

      // Búsqueda
      if (search && !nombre.includes(search.toLowerCase())) return false;

      // Rango de precios
      if (minPrice !== '' && precio < Number(minPrice)) return false;
      if (maxPrice !== '' && precio > Number(maxPrice)) return false;

      // Calificación mínima
      if (minRating !== '' && rating < Number(minRating)) return false;

      return true;
    });
  }, [baseItems, search, minPrice, maxPrice, minRating]);

  function handleClearFilters() {
    setSearch('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
  }

  return (
    <div className={styles.wrapper}>
      <SiteHeader />
      <CatalogBar />

      <main className={styles.container}>
        <h1 style={{ margin: '16px 0' }}>{categoria}</h1>

        {!baseItems.length ? (
          //No hay productos en la BD para esta categoría
          <p>No hay productos en esta categoría.</p>
        ) : (
          <div className={styles.categoryLayout}>
            {/* === Sidebar de filtros === */}
            <aside className={styles.filtersSidebar}>
              <h2 className={styles.filtersTitle}>Filtros</h2>

              {/* Búsqueda */}
              <div className={styles.filterBlock}>
                <label className={styles.filterLabel}>Buscar producto</label>
                <input
                  type="text"
                  className={styles.filterInput}
                  placeholder="Nombre, palabra clave…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Rango de precios */}
              <div className={styles.filterBlock}>
                <label className={styles.filterLabel}>Rango de precios</label>
                <div className={styles.filterPriceRow}>
                  <input
                    type="number"
                    className={styles.filterInput}
                    placeholder={
                      priceMinGlobal ? `Mín (${priceMinGlobal.toFixed(2)})` : 'Mín'
                    }
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    min={0}
                  />
                  <span className={styles.filterPriceSeparator}>–</span>
                  <input
                    type="number"
                    className={styles.filterInput}
                    placeholder={
                      priceMaxGlobal ? `Máx (${priceMaxGlobal.toFixed(2)})` : 'Máx'
                    }
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    min={0}
                  />
                </div>
              </div>

              {/* Calificación mínima */}
              <div className={styles.filterBlock}>
                <label className={styles.filterLabel}>Calificación mínima</label>
                <select
                  className={styles.filterSelect}
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                >
                  <option value="">Cualquiera</option>
                  <option value="3">★ 3.0+</option>
                  <option value="4">★ 4.0+</option>
                  <option value="4.5">★ 4.5+</option>
                </select>
              </div>

              {/* Botón limpiar */}
              <button
                type="button"
                className={styles.filterClearBtn}
                onClick={handleClearFilters}
              >
                Limpiar filtros
              </button>
            </aside>

            {/* === Grid de productos === */}
            <section className={styles.productsGrid}>
              {filteredItems.length === 0 ? (
                <p>No se encontraron productos con esos filtros.</p>
              ) : (
                <ul
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))',
                    gap: '1.25rem',
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                  }}
                >
                  {filteredItems.map((p) => {
                    const img = getProductImage(p);
                    const ratingValue = Number(p.rating ?? 4.2);

                    return (
                      <li key={p.product_id} className={styles.productCard}>
                        <a
                          href={`/productos/${p.product_id}`}
                          className={styles.productCardLink}
                        >
                          <div className={styles.productImageBox}>
                            <img
                              className={styles.productImage}
                              src={img}
                              alt={p.nombre}
                              loading="lazy"
                              onError={(e) =>
                                (e.currentTarget.src =
                                  '/products/placeholder.jpg')
                              }
                            />
                          </div>
                          <div className={styles.productBody}>
                            <h3 className={styles.productName}>
                              {p.nombre}
                            </h3>

                            <div className={styles.productMetaRow}>
                              <Stars value={ratingValue} />
                            </div>

                            <div className={styles.productPriceRow}>
                              <span className={styles.productPrice}>
                                {Number(p.precio ?? 0).toLocaleString('es-MX', {
                                  style: 'currency',
                                  currency: 'MXN',
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          </div>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export async function getServerSideProps({ req, params }) {
  try {
    const fromSlug = String(params.categoria || '').replace(/-/g, ' ');

    const proto = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const baseUrl = `${proto}://${host}`;

    const res = await fetch(`${baseUrl}/api/productos`);
    if (!res.ok) {
      return { notFound: true };
    }
    const all = await res.json();

    const items = Array.isArray(all)
      ? all.filter((p) => String(p.categoria || '').toLowerCase() === String(fromSlug || '').toLowerCase())
      : [];

    return {
      props: { categoria: fromSlug, items },
    };
  } catch (e) {
    console.error('[catalogo] getServerSideProps error:', e);
    return { props: { categoria: '', items: [] } };
  }
}
