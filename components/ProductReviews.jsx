// components/ProductReviews.jsx
import { useEffect, useState } from 'react';
import styles from '../styles/Reviews.module.css';

function renderStars(rating) {
  const full = Math.round(rating);
  return '★★★★★'
    .split('')
    .map((star, i) => (
      <span
        key={i}
        className={i < full ? styles.starFull : styles.starEmpty}
      >
        ★
      </span>
    ));
}

export default function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState('');

  const [rating, setRating] = useState(5);
  const [comentario, setComentario] = useState('');
  const [sending, setSending] = useState(false);

  // Cargar reviews al montar
  useEffect(() => {
    if (!productId) return;

    const loadReviews = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/reviews?product_id=${productId}`);
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'No se pudieron cargar reviews');
        }
        setReviews(data.reviews || []);
        setAverage(data.average || 0);
        setTotal(data.total || 0);
      } catch (err) {
        console.error(err);
        setServerError(err.message || 'Error al cargar reviews');
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!productId) return;

    try {
      setSending(true);
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          rating,
          comentario,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'No se pudo guardar la reseña');
      }

      // Volver a cargar lista
      const res2 = await fetch(`/api/reviews?product_id=${productId}`);
      const data2 = await res2.json();
      if (res2.ok && data2.ok) {
        setReviews(data2.reviews || []);
        setAverage(data2.average || 0);
        setTotal(data2.total || 0);
      }

      // Limpiar form
      setRating(5);
      setComentario('');
    } catch (err) {
      console.error(err);
      setServerError(err.message || 'Error al enviar reseña');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className={styles.wrapper}>
      <h2 className={styles.title}>Opiniones del producto</h2>

      {loading ? (
        <p className={styles.muted}>Cargando reseñas...</p>
      ) : (
        <>
          <div className={styles.summary}>
            <div className={styles.avgBlock}>
              <div className={styles.avgNumber}>
                {average.toFixed(1)}
              </div>
              <div className={styles.stars}>
                {renderStars(average)}
              </div>
              <div className={styles.count}>
                {total} reseña{total === 1 ? '' : 's'}
              </div>
            </div>
          </div>

          {serverError && (
            <div className={styles.error}>{serverError}</div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <h3 className={styles.formTitle}>Deja tu reseña</h3>

            <label className={styles.label}>
              Calificación
              <select
                className={styles.select}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              >
                <option value={5}>5 - Excelente</option>
                <option value={4}>4 - Muy bueno</option>
                <option value={3}>3 - Aceptable</option>
                <option value={2}>2 - Malo</option>
                <option value={1}>1 - Muy malo</option>
              </select>
            </label>

            <label className={styles.label}>
              Comentario (opcional)
              <textarea
                className={styles.textarea}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Cuéntanos qué te pareció el producto..."
              />
            </label>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={sending}
            >
              {sending ? 'Enviando...' : 'Publicar reseña'}
            </button>

            <p className={styles.loginHint}>
            </p>
          </form>

          <div className={styles.list}>
            {reviews.length === 0 ? (
              <p className={styles.muted}>
                Aún no hay comentarios para este producto.
              </p>
            ) : (
              reviews.map((r) => (
                <article
                  key={r.review_id}
                  className={styles.reviewCard}
                >
                  <div className={styles.reviewHeader}>
                    <div className={styles.reviewStars}>
                      {renderStars(r.rating)}
                    </div>
                    <span className={styles.reviewRating}>
                      {r.rating}/5
                    </span>
                  </div>
                  {r.comentario && (
                    <p className={styles.reviewText}>
                      {r.comentario}
                    </p>
                  )}
                  <div className={styles.reviewMeta}>
                    {new Date(r.created_at).toLocaleString('es-MX')}
                  </div>
                </article>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}
