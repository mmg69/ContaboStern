// pages/perfil.jsx
import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from '../styles/ProfilePage.module.css';

const imgLogo = '/LogoSTERN.png';

export default function PerfilPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setServerError('');
        const res = await fetch('/api/client/me');
        const data = await res.json();

        // data.ok viene de /api/client/me
        if (data.ok && data.profile) {
          setProfile(data.profile);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('[perfil] error cargando perfil:', err);
        setServerError('Error al cargar la información de tu perfil.');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <a href="/">
            <img src={imgLogo} className={styles.logoImg} alt="STERN" />
          </a>
          <h1 className={styles.title}>Mi perfil</h1>
        </header>
        <div className={styles.empty}>Cargando perfil...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a href="/">
          <img src={imgLogo} className={styles.logoImg} alt="STERN" />
        </a>
        <h1 className={styles.title}>Mi perfil</h1>
      </header>

      {serverError && (
        <div className={styles.empty}>
          <p>{serverError}</p>
        </div>
      )}

      {!serverError && !profile && (
        <div className={styles.empty}>
          <p>No se encontró información de perfil.</p>
          <p>
            Asegúrate de haber iniciado sesión con tu cuenta y de haber hecho al menos un registro
            de datos (por ejemplo desde el registro o el checkout).
          </p>
          <div style={{ marginTop: '1rem' }}>
            <Link href="/login" className={styles.btn}>
              Ir a iniciar sesión
            </Link>
          </div>
        </div>
      )}

      {!serverError && profile && (
        <div className={styles.card}>
          <div className={styles.field}>
            <label>Nombre</label>
            <span>{profile.nombre}</span>
          </div>

          <div className={styles.field}>
            <label>Correo</label>
            <span>{profile.correo}</span>
          </div>

          <div className={styles.field}>
            <label>Teléfono</label>
            <span>{profile.telefono || '-'}</span>
          </div>

          <div className={styles.field}>
            <label>Dirección</label>
            <span>{profile.direccion || '-'}</span>
          </div>

          <div className={styles.field}>
            <label>Ciudad</label>
            <span>{profile.ciudad || '-'}</span>
          </div>

          <div className={styles.field}>
            <label>Código Postal</label>
            <span>{profile.cp || '-'}</span>
          </div>

          <div className={styles.field}>
            <label>País</label>
            <span>{profile.pais || '-'}</span>
          </div>

          <div className={styles.actions}>
            <Link href="/checkout" className={styles.btnSecondary}>
              Usar estos datos en el checkout
            </Link>
            <Link href="/registro" className={styles.btn}>
              Editar datos
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
