// pages/carrito.jsx
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import SiteHeader from '../components/SiteHeader';
import CatalogBar from '../components/CatalogBar';
import {
  readCart,
  updateCartQuantity,
  removeFromCart,
} from '../lib/cart';
import styles from '../styles/CartPage.module.css';
import { getProductImage } from '../lib/images'; // 👈 IMPORTANTE


function formatMoney(n) {
  return Number(n ?? 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  });
}

export default function CarritoPage() {
  const [items, setItems] = useState([]);

  // Cargar carrito desde localStorage al montar
  useEffect(() => {
    setItems(readCart());
  }, []);

  const handleIncrement = (product_id) => {
    const current = items.find(
      (it) => Number(it.product_id) === Number(product_id)
    );
    const stock = current?.cantidad_stock || 99;
    const nueva = Math.min((current?.cantidad || 1) + 1, stock);
    const next = updateCartQuantity(product_id, nueva);
    setItems(next);
  };

  const handleDecrement = (product_id) => {
    const current = items.find(
      (it) => Number(it.product_id) === Number(product_id)
    );
    const nueva = Math.max(1, (current?.cantidad || 1) - 1);
    const next = updateCartQuantity(product_id, nueva);
    setItems(next);
  };

  const handleChangeQty = (product_id, value) => {
    const val = Number(value) || 1;
    const next = updateCartQuantity(product_id, val);
    setItems(next);
  };

  const handleRemove = (product_id) => {
    const next = removeFromCart(product_id);
    setItems(next);
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (acc, it) => acc + Number(it.precio) * (it.cantidad || 1),
      0
    );
    const envio = 0; // Gratis
    const impuestoImportacion = subtotal * 0.08; // 8% ficticio
    const total = subtotal + envio + impuestoImportacion;
    return { subtotal, envio, impuestoImportacion, total };
  }, [items]);

  return (
    <div className={styles.page}>
      <SiteHeader />
      <CatalogBar />

      <main className={styles.main}>
        <div className={styles.titleRow}>
          <h1>Carrito de compras</h1>
          <Link href="/" className={styles.backLink}>
            ← Explorar productos
          </Link>
        </div>

        <div className={styles.layout}>
          {/* Lista de productos */}
          <section className={styles.itemsPanel}>
            {items.length === 0 ? (
              <div className={styles.emptyBox}>
                <p>Tu carrito está vacío.</p>
                <Link href="/" className={styles.primaryLink}>
                  Ver catálogo
                </Link>
              </div>
            ) : (
              <ul className={styles.itemsList}>
                {items.map((it) => {
                  const imgSrc = getProductImage(it); // 👈 misma lógica que FeaturedProducts
                
                  const lineTotal =
                    Number(it.precio) * (it.cantidad || 1);

                  return (
                    <li
                      key={it.product_id}
                      className={styles.itemRow}
                    >
                      <div className={styles.itemImageBox}>
                        <img
                          src={imgSrc}
                          alt={it.nombre}
                          className={styles.itemImage}
                          onError={(e) => {
                            e.currentTarget.src =
                              '/products/placeholder.png';
                          }}
                        />
                      </div>

                      <div className={styles.itemInfo}>
                        <div className={styles.itemHeader}>
                          <div>
                            <p className={styles.itemName}>
                              {it.nombre}
                            </p>
                            <p className={styles.itemCategory}>
                              {it.categoria}
                            </p>
                            <p className={styles.itemPriceUnit}>
                              Precio unitario:{' '}
                              {formatMoney(it.precio)}
                            </p>
                            <p
                              className={`${styles.itemStock} ${
                                it.cantidad_stock > 0
                                  ? styles.stockOk
                                  : styles.stockLow
                              }`}
                            >
                              {it.cantidad_stock > 0
                                ? `En almacén: ${it.cantidad_stock} unidades`
                                : 'Sin existencia'}
                            </p>
                          </div>
                        </div>

                        <div className={styles.itemFooter}>
                          <div className={styles.quantityControl}>
                            <button
                              type="button"
                              onClick={() =>
                                handleDecrement(it.product_id)
                              }
                              className={styles.qtyButton}
                            >
                              –
                            </button>

                            <input
                              type="number"
                              min={1}
                              max={it.cantidad_stock || 99}
                              value={it.cantidad || 1}
                              onChange={(e) =>
                                handleChangeQty(
                                  it.product_id,
                                  e.target.value
                                )
                              }
                              className={styles.qtyInput}
                            />

                            <button
                              type="button"
                              onClick={() =>
                                handleIncrement(it.product_id)
                              }
                              className={styles.qtyButton}
                            >
                              +
                            </button>
                          </div>

                          <div
                            className={styles.itemLineTotal}
                          >
                            <span>Total:</span>
                            <strong>
                              {formatMoney(lineTotal)}
                            </strong>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleRemove(it.product_id)
                          }
                          className={styles.removeButton}
                        >
                          ❌ Eliminar
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Resumen de pedido */}
          <aside className={styles.summaryPanel}>
            <div className={styles.summaryCard}>
              <h2>Resumen del pedido</h2>

              <dl className={styles.summaryList}>
                <div className={styles.summaryRow}>
                  <dt>Subtotal</dt>
                  <dd>{formatMoney(totals.subtotal)}</dd>
                </div>

                <div className={styles.summaryRow}>
                  <dt>Envío</dt>
                  <dd>Gratis</dd>
                </div>

                <div className={styles.summaryRow}>
                  <dt>Impuesto de importación (estimado)</dt>
                  <dd>
                    {formatMoney(totals.impuestoImportacion)}
                  </dd>
                </div>

                <div
                  className={`${styles.summaryRow} ${styles.summaryTotalRow}`}
                >
                  <dt>Total</dt>
                  <dd>{formatMoney(totals.total)}</dd>
                </div>
              </dl>

              {items.length > 0 ? (
                <Link href="/checkout" className={styles.checkoutButton}>
                  Proceder al pago
                </Link>
              ) : (
                <button
                  type="button"
                  className={`${styles.checkoutButton} ${styles.checkoutButtonDisabled}`}
                  disabled
                >
                  Proceder al pago
                </button>
              )}

              <p className={styles.checkoutNote}>
                * El costo de importación mostrado es sólo de
                referencia para esta versión del sistema.
              </p>
              <br />
              <p className={styles.datosVerdes}> &#x2714; Garantía de seguridad en tu compra</p>
              <br />
              <p className={styles.datosVerdes}> &#x1F6E1; Pago 100% seguro y cifrado</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
