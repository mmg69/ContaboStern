//pages/login/index.jsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '/styles/Login.module.css';

const LogoStern = '/LogoSTERN.png';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Error de autenticación');
            }
            router.push('/');
        } catch (e) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className={styles.page}>
            <div className={styles.card}>
                <img src={LogoStern} alt="STERN" className={styles.logo} />
                <h1 className={styles.title}>Bienvenido a la compra del hogar</h1>

                <form onSubmit={onSubmit} className={styles.form}>
                    <label className={styles.label}>Email</label>
                    <input
                        className={styles.input}
                        type="email"
                        placeholder="Correo"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <br />
                    <label className={styles.label}>Contraseña</label>
                    <input
                        className={styles.input}
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button className={styles.button} type="submit" disabled={loading}>
                        {loading ? 'Entrando…' : 'Entrar'}
                    </button>
                    <p className={styles.registerText}>
                        ¿No tienes cuenta?{' '}
                        <a href="/registro" className={styles.registerLink}>
                            Regístrate
                        </a>
                    </p>
                    <p className={styles.registerText}>
                        {' '}
                        <a href="/login/admin" className={styles.registerLink}>
                            Modo Administrador
                        </a>
                    </p>
                    {err ? <p className={styles.error}>{err}</p> : null}
                </form>
            </div>
        </main>
    );
}
