// pages/index.jsx
import MenuPrincipal from '../components/MenuPrincipal';

function toPlain(d) {
  return JSON.parse(JSON.stringify(d, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));
}

export default function Home({ featured }) {
  return <>

  <MenuPrincipal featured={featured} />;
  </>
}
const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correo,          // 👈 este nombre debe coincidir
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Error al iniciar sesión');
    }

    // Redirige a donde quieras, por ejemplo:
    router.push('/');
  } catch (err) {
    console.error(err);
    setError(err.message || 'Error al iniciar sesión');
  }
};

export async function getServerSideProps({ req }) {
  const token = req.cookies?.app_token;

  // Si no hay token → redirige al login
  if (!token) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  try {
    // construir base URL desde la petición para poder llamar a la API interna
    const proto = req.headers['x-forwarded-proto'] || (req.headers.referer && req.headers.referer.startsWith('https') ? 'https' : 'http');
    const host = req.headers.host;
    const base = `${proto}://${host}`;

    const apiRes = await fetch(`${base}/api/productos`);
    const products = await apiRes.json().catch(() => []);

    const featured = Array.isArray(products)
      ? products.filter(p => p.activo && Number(p.cantidad_stock || 0) > 0)
      : [];

    return { props: { featured: toPlain(featured) } };
  } catch (e) {
    console.error('SSR featured error:', e);
    return { props: { featured: [] } };
  }
}
