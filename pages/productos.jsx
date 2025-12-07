// /pages/productos/[id].jsx
import { fetchProductById, fetchProductIds } from "../lib/products";
import styles from "../styles/mainPage.module.css";
import Link from "next/link";

export default function ProductoPage({ product }) {
  if (!product) {
    return <div style={{ padding: 24 }}>Producto no encontrado.</div>;
  }

  return (
    <main className={styles.productDetail}>
      <Link href="/" className={styles.backLink}>← Volver</Link>

      <div className={styles.detailGrid}>
        <div className={styles.detailImageWrap}>
          <img src={product.img} alt={product.name} className={styles.detailImage} />
        </div>

        <div className={styles.detailInfo}>
          <p className={styles.cat}>{product.category}</p>
          <h1 className={styles.detailTitle}>{product.name}</h1>
          <div className={styles.ratingRow}>⭐ {product.rating.toFixed(1)}</div>

          <div className={styles.detailPriceRow}>
            <span className={styles.detailPrice}>${product.price.toFixed(2)}</span>
            <span className={styles.detailDiscount}>-{product.discount}</span>
          </div>

          {product.description && (
            <p className={styles.detailDesc}>{product.description}</p>
          )}

          <button className={styles.buyBtn}>Agregar al carrito</button>
        </div>
      </div>
    </main>
  );
}

export async function getStaticPaths() {
  const ids = await fetchProductIds();
  const paths = ids.map(id => ({ params: { id } }));
  return {
    paths,
    fallback: "blocking", // genera en 1a petición si no existía (útil con BD)
  };
}

export async function getStaticProps({ params }) {
  const product = await fetchProductById(params.id);

  if (!product) {
    return { notFound: true, revalidate: 10 };
  }

  return {
    props: { product },
    revalidate: 60, // ISR: refresca cada 60s si hay cambios en BD
  };
}
