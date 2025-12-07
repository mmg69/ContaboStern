// components/MenuPrincipal.jsx
import { useState, useEffect } from 'react';
import styles from '../styles/mainPage.module.css';
import FeaturedProducts from './FeaturedProducts';
import { getProductImage } from '../lib/images';
import Link from 'next/link';
import CatalogBar from './CatalogBar';
import SiteHeader from './SiteHeader';

const imgLogo = '/LogoSTERN.png';

export default function MenuPrincipal({ products = [], featured = [] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLinkClick = () => setOpen(false);

  const filtered = q
    ? products.filter(p => (p?.nombre || '').toLowerCase().includes(q.toLowerCase()))
    : products;

  return (
    <div className={styles.bodyy}>
      <SiteHeader/>
      <CatalogBar/>      
      {/* Categorías */}


      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>¡Transforma tu Hogar!</h1>
          <p className={styles.heroSubtitle}>Tecnología confiable para tu hogar y negocio</p>
        </div>
      </section>

      {/* Featured */}
      <FeaturedProducts items={featured} />


    </div>
  );
}
export async function getStaticProps() {
  const featured = await fetchFeaturedProducts(8); // 8 productos recomendados

  return {
    props: {
      featured,
    },
    revalidate: 300, // ISR (opcional): re-generar cada 5 minutos
  };
}