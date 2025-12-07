// pages/checkout/success.jsx
import Link from 'next/link';
import Head from 'next/head';
import styles from '../../styles/CheckoutSuccess.module.css';

function formatMoney(n, currency = 'MXN') {
  const num = Number(n ?? 0);
  return num.toLocaleString('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  });
}

export default function CheckoutSuccessPage({ ok, order, error }) {
  return (
    <div className={styles.page}>
      <Head>
        <title>{ok ? 'Compra realizada | STERN' : 'Pedido no encontrado | STERN'}</title>
      </Head>

      <main className={styles.main}>
        <div className={styles.card}>
          {ok ? (
            <>
              {/* Icono de éxito */}
              <div className={styles.iconCircle}>
                <span className={styles.iconCheck}>✔</span>
              </div>

              <h1 className={styles.title}>¡Compra realizada!</h1>
              <p className={styles.subtitle}>
                Tu pedido ha sido procesado exitosamente.
              </p>

              {/* Bloque con info del pedido */}
              <section className={styles.infoBox}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Número de pedido:</span>
                  <span className={styles.infoValue}>#{order.orderId}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Total pagado:</span>
                  <span className={styles.infoValue}>
                    {formatMoney(order.total, order.moneda)}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Fecha del pago:</span>
                  <span className={styles.infoValue}>
                    {order.fecha
                      ? new Date(order.fecha).toLocaleString('es-MX', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                      : '—'}
                  </span>
                </div>
              </section>

              {/* Botones de acción (placeholders por ahora)
              <div className={styles.actionsPrimary}>
                <button
                  type="button"
                  className={styles.ghostButton}
                  onClick={() =>
                    alert('La descarga de factura se implementará próximamente.')
                  }
                >
                  ⬇ Descargar factura
                </button>

                <button
                  type="button"
                  className={styles.ghostButton}
                  onClick={() =>
                    alert('El rastreo de pedidos se implementará próximamente.')
                  }
                >
                  Rastrear pedido
                </button>
              </div>
 */}
              <div className={styles.actionsSecondary}>
                <Link href="/" className={styles.primaryButton}>
                  Volver al inicio
                </Link>
              </div>

              <div className={styles.footerNote}>
                Te hemos enviado un correo con los detalles de tu compra
                {order.clienteCorreo ? (
                  <>
                    &nbsp;a&nbsp;
                    <span className={styles.emailHighlight}>
                      {order.clienteCorreo}
                    </span>
                  </>
                ) : null}
                .
              </div>
            </>
          ) : (
            <>
              <div className={`${styles.iconCircle} ${styles.iconError}`}>
                <span className={styles.iconCheck}>!</span>
              </div>
              <h1 className={styles.title}>No pudimos encontrar tu pedido</h1>
              <p className={styles.subtitle}>
                {error || 'Verifica el enlace o intenta nuevamente desde tu historial de compras.'}
              </p>
              <div className={styles.actionsSecondary}>
                <Link href="/" className={styles.primaryButton}>
                  🏠 Volver al inicio
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// -------- Server Side --------
export async function getServerSideProps({ req, query }) {
  try {
    const { order_id } = query;

    if (!order_id || Number.isNaN(Number(order_id))) {
      return {
        props: {
          ok: false,
          order: null,
          error: 'El ID de pedido no es válido.',
        },
      };
    }

    const proto = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const baseUrl = `${proto}://${host}`;

    const res = await fetch(`${baseUrl}/api/pedidos`);
    if (!res.ok) {
      throw new Error('Error al obtener pedidos desde la API');
    }
    const pedidos = await res.json();

    const found = Array.isArray(pedidos)
      ? pedidos.find((p) => String(p.order_id) === String(order_id))
      : null;

    if (!found) {
      return {
        props: {
          ok: false,
          order: null,
          error: 'No existe un pedido con ese número.',
        },
      };
    }

    const plainOrder = {
      orderId: String(found.order_id),
      estado: found.estado,
      total: String(found.monto ?? '0'),
      moneda: found.moneda || 'MXN',
      fecha: found.fecha ?? null,
      clienteNombre: found.cliente ?? '',
      clienteCorreo: null,
    };

    return {
      props: {
        ok: true,
        order: plainOrder,
        error: null,
      },
    };
  } catch (err) {
    console.error('[checkout/success] error:', err);
    return {
      props: {
        ok: false,
        order: null,
        error: 'Ocurrió un error al cargar la información del pedido.',
      },
    };
  }
}
