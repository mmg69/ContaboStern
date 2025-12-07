// pages/registro.jsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/RegisterPage.module.css'; 

const LogoStern = '/LogoSTERN.png';

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    ciudad: '',
    region: '',
    pais: '',
    direccion: '',
    cp: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // 👉 Al entrar, ver si ya hay perfil para prellenar
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch('/api/client/me');
        const data = await res.json();

        if (data.ok && data.profile) {
          const p = data.profile;
          setForm((prev) => ({
            ...prev,
            nombre: p.nombre || '',
            correo: p.correo || '',
            telefono: p.telefono || '',
            ciudad: p.ciudad || '',
            region: p.region || '',
            pais: p.pais || '',
            direccion: p.direccion || '',
            cp: p.cp || '',
            password: '', 
          }));
          setIsEditing(true); // 👈 Modo edición
        }
      } catch (err) {
        console.error('[registro] error cargando perfil:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const endpoint = isEditing
      ? '/api/client/upsert'
      : '/api/client/register';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json().catch(() => ({}));

    // === Caso 1: ya existe usuario (HTTP 409)
    if (res.status === 409) {
      setError('Este correo ya se encuentra registrado. Inicia sesión.');
      setLoading(false);
      return;
    }

    // === Caso 2: otros errores
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Error al guardar datos');
    }

    // === Caso 3: OK → mandar a login
    router.push('/login?registered=1');
  } catch (err) {
    console.error('[registro] error:', err);
    setError(err.message || 'Error al registrar/actualizar cliente');
  } finally {
    setLoading(false);
  }
};



  if (loadingProfile) {
    return <div className={styles.page}>Cargando datos...</div>;
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img src={LogoStern} alt="STERN" className={styles.logo} />

          <h1 className={styles.title}>

            {isEditing ? 'Editar mis datos' : 'Registro de cliente'}
          </h1>
        </div>

        <br />
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <p className={styles.error}>{error}</p>}

          <label className={styles.label}>Nombre completo</label>
          <input
            className={styles.input}
            type="text"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            required
          />

          <label className={styles.label}>Correo</label>
          <input
            className={styles.input}
            type="email"
            name="correo"
            value={form.correo}
            onChange={handleChange}
            required
            disabled={isEditing} // en edición no dejamos cambiar el correo
          />

          <label className={styles.label}>Teléfono</label>
          <input
            className={styles.input}
            type="text"
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
          />

          <label className={styles.label}>Dirección</label>
          <input
            className={styles.input}
            type="text"
            name="direccion"
            value={form.direccion}
            onChange={handleChange}
          />

          <label className={styles.label}>Ciudad</label>
          <input
            className={styles.input}
            type="text"
            name="ciudad"
            value={form.ciudad}
            onChange={handleChange}
          />

          <div className={styles.twoCols}>
            <div>
              <label className={styles.label}>Código Postal </label>
              <input
                className={styles.input}
                type="text"
                name="cp"
                value={form.cp}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className={styles.label}>País </label>
              <input
                className={styles.input}
                type="text"
                name="pais"
                value={form.pais}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Password solo tiene sentido en registro o si el usuario quiere cambiarla */}
          <label className={styles.label}>
            {isEditing ? 'Nueva contraseña (opcional)' : 'Contraseña'}
          </label>
          <input
            className={styles.input}
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder={isEditing ? 'Déjalo vacío para no cambiar' : ''}
            required={!isEditing}
          />

          <div className={styles.formActions}>
            <button
              className={styles.primaryBtn}
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'Guardando...'
                : isEditing
                  ? 'Guardar cambios'
                  : 'Registrar'}
            </button>

            <div className={styles.loginHint}>
              ¿Ya tienes cuenta?{' '}
              <a href="/login" className={styles.loginLink}>
                Volver al login
              </a>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
