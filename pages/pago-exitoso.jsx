// pages/pago-exitoso.jsx
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function PagoExitosoPage() {
  const router = useRouter();
  const { orderId, total, moneda } = router.query;

  return (
    <main style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1>✅ Pago exitoso</h1>
      {orderId ? (
        <>
          <p>
            Tu pedido <strong>#{orderId}</strong> ha sido registrado.
          </p>
          <p>
            Importe total: <strong>{total}</strong> {moneda || 'MXN'}
          </p>
        </>
      ) : (
        <p>No se encontró información de pedido en la URL.</p>
      )}

      <p style={{ marginTop: '1.5rem' }}>
        (En la versión real, aquí mostrarías el resumen del pago confirmado por PayPal.)
      </p>

      <Link href="/">Volver al inicio</Link>
    </main>
  );
}
