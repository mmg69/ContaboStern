import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/AdminLogin.module.css';
import Link from 'next/link';
const LogoStern = '/LogoStern.png';
export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    router.push('/admin/dashboard');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoContainer}>
          <img src={LogoStern} alt="LogoStern" className={styles.logoStern} />
        </div>

        <h2 className={styles.title}>Panel de Administración</h2>
        <p className={styles.subtitle}>Acceso restringido</p>

        <form onSubmit={handleAdminLogin} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="admin@email.com"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className={styles.button}>
            Acceder como Administrador
          </button>
        </form>
        <a href="/login" className={styles.registerLink}>
        Volver al login de usuario
        </a>
      </div>
    </div>
  );
}

