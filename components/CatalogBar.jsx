// components/CatalogBar.jsx
import styles from '../styles/ProductDetail.module.css';
import { slugify } from '../lib/slugify';

const DEFAULT_CATS = [
  'Iluminacion',
  'Seguridad y Acceso',
  'Sensores y Control Ambiental',
  'Controladores y Automatizacion',
  'Estilo de Vida y Entretenimiento',
  'Domotica para Exterior',
];

export default function CatalogBar({ categories = DEFAULT_CATS }) {
  if (!categories?.length) return null;

  return (
    
    <section className={styles.categories}>
      <div className={styles.catalogsInner}>
        {categories.map((c) => (
  <a
  href={`/catalogo/${slugify(c)}`}
  className={`${styles.catalogPill} ${c === categories ? styles.catalogPillActive : ''}`}
>
  {c}
</a>

        ))}
      </div>
    </section>
  );
}
