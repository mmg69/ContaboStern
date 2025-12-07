// pages/checkout.jsx
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import SiteHeader from '../components/SiteHeader';
import CatalogBar from '../components/CatalogBar';
import { readCart, writeCart } from '../lib/cart';
import styles from '../styles/CheckoutPage.module.css';
import { PayPalButtons } from '@paypal/react-paypal-js';

function formatMoney(n) {
  return Number(n ?? 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  });
}

const STEPS = [
  { id: 1, label: 'Datos de envío' },
  { id: 2, label: 'Método de pago' },
];

export default function CheckoutPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [cartItems, setCartItems] = useState([]);

  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    direccion: '',
    ciudad: '',
    cp: '',
    pais: '',
    telefono: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [orderInfo, setOrderInfo] = useState(null);
  const [serverError, setServerError] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  // Cargar carrito y perfil de cliente
  useEffect(() => {
    // 1) Carrito
    const items = readCart();
    setCartItems(Array.isArray(items) ? items : []);

    // 2) Perfil de cliente
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/client/me');
        if (!res.ok) return;

        const data = await res.json();
        if (!data.ok || !data.profile) return;

        const p = data.profile;

        setForm((prev) => ({
          ...prev,
          nombre: p.nombre || '',
          correo: p.correo || '',
          telefono: p.telefono || '',
          direccion: p.direccion || '',
          ciudad: p.ciudad || '',
          cp: p.cp || '',
          pais: p.pais || '',
        }));
      } catch (err) {
        console.error('[checkout] error cargando perfil:', err);
      }
    };

    fetchProfile();
  }, []);

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce(
      (acc, it) => acc + Number(it.precio || 0) * (it.cantidad || 1),
      0
    );
    const envio = 0; // Gratis
    const impuesto = subtotal * 0.08; // 8% ficticio
    const total = subtotal + envio + impuesto;
    return { subtotal, envio, impuesto, total };
  }, [cartItems]);

  const validateShipping = () => {
    const newErrors = {};
    if (!form.nombre.trim()) newErrors.nombre = 'Campo requerido';
    if (!form.correo.trim()) newErrors.correo = 'Campo requerido';
    if (!form.direccion.trim()) newErrors.direccion = 'Campo requerido';
    if (!form.ciudad.trim()) newErrors.ciudad = 'Campo requerido';
    if (!form.cp.trim()) newErrors.cp = 'Campo requerido';
    if (!form.pais.trim()) newErrors.pais = 'Campo requerido';
    if (!form.telefono.trim()) newErrors.telefono = 'Campo requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleShippingSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateShipping()) return;
    if (cartItems.length === 0) {
      setServerError('Tu carrito está vacío.');
      return;
    }

    try {
      setLoading(true);

      // 1) Guardar / actualizar perfil del cliente (no bloquea si falla)
      try {
        await fetch('/api/client/upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: form.nombre,
            correo: form.correo,
            telefono: form.telefono,
            ciudad: form.ciudad,
            region: '', // si después agregas al form, rellenas aquí
            pais: form.pais,
            direccion: form.direccion,
            cp: form.cp,
          }),
        });
      } catch (err) {
        console.error('[checkout] error guardando perfil cliente:', err);
        // No hacemos throw para no romper la compra
      }

      // 2) Crear pedido en backend
      const res = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            nombre: form.nombre,
            correo: form.correo,
            telefono: form.telefono,
            ciudad: form.ciudad,
            region: '',
            pais: form.pais,
            direccion: form.direccion,
            cp: form.cp,
          },
          items: cartItems.map((it) => ({
            product_id: it.product_id,
            cantidad: it.cantidad || 1,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'No se pudo crear el pedido');
      }

      setOrderInfo({
        orderId: data.order_id,
        total: data.total,
        moneda: data.moneda,
      });

      setStep(2);
    } catch (err) {
      console.error(err);
      setServerError(err.message || 'Error al crear el pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setServerError('');
  };

  const isCartEmpty = cartItems.length === 0;

  return (
    <div className={styles.page}>
      <SiteHeader />
      <CatalogBar />

      <main className={styles.main}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Finalizar compra</h1>
          <Link href="/carrito" className={styles.backLink}>
            ← Volver al carrito
          </Link>
        </div>

        {/* Barra de pasos */}
        <div className={styles.stepper}>
          {STEPS.map((s, index) => {
            const isActive = s.id === step;
            const isDone = s.id < step;
            return (
              <div key={s.id} className={styles.stepWrapper}>
                {index > 0 && (
                  <div
                    className={`${styles.stepLine} ${
                      s.id <= step ? styles.stepLineActive : ''
                    }`}
                  />
                )}
                <div className={styles.stepItem}>
                  <div
                    className={
                      isDone
                        ? `${styles.stepCircle} ${styles.stepCircleDone}`
                        : isActive
                        ? `${styles.stepCircle} ${styles.stepCircleActive}`
                        : styles.stepCircle
                    }
                  >
                    {isDone ? '✓' : s.id}
                  </div>
                  <span
                    className={
                      isActive
                        ? `${styles.stepLabel} ${styles.stepLabelActive}`
                        : styles.stepLabel
                    }
                  >
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {isCartEmpty ? (
          <div className={styles.emptyBox}>
            <p>Tu carrito está vacío. No hay nada que procesar.</p>
            <Link href="/" className={styles.primaryBtn}>
              Ir al catálogo
            </Link>
          </div>
        ) : (
          <div className={styles.layout}>
            {/* Columna izquierda: pasos */}
            <section className={styles.leftPanel}>
              {step === 1 && (
                <form onSubmit={handleShippingSubmit} className={styles.card}>
                  <h2 className={styles.sectionTitle}>Datos de envío</h2>

                  {serverError && (
                    <div className={styles.serverError}>{serverError}</div>
                  )}

                  <ShippingField
                    label="Nombre completo"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    error={errors.nombre}
                    placeholder="Juan Pérez"
                  />

                  <ShippingField
                    label="Correo electrónico"
                    name="correo"
                    value={form.correo}
                    onChange={handleChange}
                    error={errors.correo}
                    placeholder="correo@ejemplo.com"
                  />
                  <ShippingField
                    label="Dirección"
                    name="direccion"
                    value={form.direccion}
                    onChange={handleChange}
                    error={errors.direccion}
                    placeholder="Calle Principal 123, Apto 4B"
                  />
                  <ShippingField
                    label="Ciudad"
                    name="ciudad"
                    value={form.ciudad}
                    onChange={handleChange}
                    error={errors.ciudad}
                    placeholder="Ciudad de México"
                  />
                  <div className={styles.twoCols}>
                    <ShippingField
                      label="Código Postal"
                      name="cp"
                      value={form.cp}
                      onChange={handleChange}
                      error={errors.cp}
                      placeholder="28001"
                    />
                    <ShippingField
                      label="País"
                      name="pais"
                      value={form.pais}
                      onChange={handleChange}
                      error={errors.pais}
                      placeholder="México"
                    />
                  </div>
                  <ShippingField
                    label="Teléfono"
                    name="telefono"
                    value={form.telefono}
                    onChange={handleChange}
                    error={errors.telefono}
                    placeholder="+52 555 123 4567"
                  />

                  <div className={styles.actionsRow}>
                    <button
                      type="submit"
                      className={styles.primaryBtn}
                      disabled={loading}
                    >
                      {loading ? 'Creando pedido...' : 'Continuar al pago'}
                    </button>
                  </div>
                </form>
              )}

              {step === 2 && (
                <div className={styles.card}>
                  <h2 className={styles.sectionTitle}>Método de pago</h2>

                  {orderInfo && (
                    <p className={styles.paymentHint}>
                      Pedido <strong>#{orderInfo.orderId}</strong> &mdash; Total:{' '}
                      <strong>{formatMoney(orderInfo.total)}</strong> ({orderInfo.moneda})
                    </p>
                  )}

                  {/* Botón oficial de PayPal */}
                  {orderInfo && (
                    <div style={{ marginTop: '1rem' }}>
                      <PayPalButtons
                        style={{ layout: 'vertical' }}
                        disabled={payLoading}
                        createOrder={(data, actions) => {
                          return actions.order.create({
                            purchase_units: [
                              {
                                amount: {
                                  currency_code: orderInfo.moneda || 'MXN',
                                  value: Number(orderInfo.total || 0).toFixed(2),
                                },
                                description: `Pedido STERN #${orderInfo.orderId}`,
                              },
                            ],
                          });
                        }}
                        onApprove={async (data, actions) => {
                          try {
                            setPayLoading(true);
                            setServerError('');

                            const details = await actions.order.capture();
                            console.log('[PayPal capture details]', details);

                            const paypal_txn_id = details.id;
                            const paypal_status = details.status;

                            // 1) Marcar pedido como pagado en tu backend
                            const res = await fetch('/api/checkout/mark-paid', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                order_id: orderInfo.orderId,
                                paypal_txn_id,
                                paypal_status,
                                paypal_raw: details,
                              }),
                            });

                            const dataResp = await res.json();
                            if (!res.ok || !dataResp.ok) {
                              throw new Error(
                                dataResp.error || 'No se pudo marcar como pagado'
                              );
                            }

                            // 2) Limpiar carrito en localStorage
                            writeCart([]);

                            // 3) Redirigir a página de éxito
                            router.push(
                              `/checkout/success?order_id=${orderInfo.orderId}`
                            );
                          } catch (err) {
                            console.error('[PayPal onApprove error]', err);
                            setServerError(
                              err.message || 'Error al procesar el pago con PayPal'
                            );
                          } finally {
                            setPayLoading(false);
                          }
                        }}
                        onError={(err) => {
                          console.error('[PayPal onError]', err);
                          setServerError(
                            'Ocurrió un error con PayPal. Intenta de nuevo.'
                          );
                        }}
                      />
                    </div>
                  )}

                  <div className={styles.actionsRow}>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => setStep(1)}
                      disabled={payLoading}
                    >
                      ← Volver a datos de envío
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Columna derecha: resumen */}
            <aside className={styles.rightPanel}>
              <div className={styles.card}>
                <h2 className={styles.sectionTitle}>Resumen del pedido</h2>

                <ul className={styles.summaryList}>
                  {cartItems.map((it) => {
                    const lineTotal =
                      Number(it.precio || 0) * (it.cantidad || 1);
                    return (
                      <li key={it.product_id} className={styles.summaryItem}>
                        <div>
                          <div className={styles.summaryName}>{it.nombre}</div>
                          <div className={styles.summaryMeta}>
                            Cantidad: {it.cantidad || 1}
                          </div>
                        </div>
                        <div className={styles.summaryPrice}>
                          {formatMoney(lineTotal)}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <dl className={styles.totalsList}>
                  <div className={styles.totalsRow}>
                    <dt>Subtotal</dt>
                    <dd>{formatMoney(totals.subtotal)}</dd>
                  </div>
                  <div className={styles.totalsRow}>
                    <dt>Envío</dt>
                    <dd>Gratis</dd>
                  </div>
                  <div className={styles.totalsRow}>
                    <dt>Impuesto estimado</dt>
                    <dd>{formatMoney(totals.impuesto)}</dd>
                  </div>
                  <div
                    className={`${styles.totalsRow} ${styles.totalsRowTotal}`}
                  >
                    <dt>Total</dt>
                    <dd>{formatMoney(totals.total)}</dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

// Campo reutilizable
function ShippingField({ label, name, value, onChange, error, placeholder }) {
  return (
    <div className={styles.field}>
      <label htmlFor={name} className={styles.fieldLabel}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${styles.fieldInput} ${
          error ? styles.fieldInputError : ''
        }`}
      />
      {error && <div className={styles.fieldError}>{error}</div>}
    </div>
  );
}
