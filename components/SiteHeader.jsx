// components/SiteHeader.jsx
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/mainPage.module.css';
import CartButton from './CartButton';

const imgLogo = '/LogoSTERN.png';

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  // ESC cierra menú y dropdown
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setShowSuggestions(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Click fuera cierra sugerencias
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLinkClick = () => setOpen(false);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);

    console.log('[search] input value:', value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value || value.trim().length < 2) {
      console.log('[search] muy corto, limpiando sugerencias');
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setSearchLoading(true);
        console.log('[search] fetching...', value);
        const res = await fetch(
          `/api/search/products?q=${encodeURIComponent(value)}`
        );
        const data = await res.json().catch(() => ({}));
        console.log('[search] response:', res.status, data);

        if (res.ok && data.ok) {
          setSuggestions(data.results || []);
          setShowSuggestions((data.results || []).length > 0);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error('[search] error:', err);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  // Enter: ir al primer resultado si existe
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    console.log('[search] submit, suggestions:', suggestions);

    if (suggestions.length > 0) {
      const first = suggestions[0];
      // AJUSTA ESTA RUTA A TU DETALLE REAL
      router.push(`/productos/${first.product_id}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (prod) => {
    // AJUSTA ESTA RUTA A TU DETALLE REAL
    router.push(`/productos/${prod.product_id}`);
    setShowSuggestions(false);
  };
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (err) {
      console.error('[logout] error:', err);
    } finally {
      setOpen(false);
      router.push('/login');
    }
  };
  return (
    <header className={styles.siteHeader} ref={wrapperRef}>
      <div className={styles.left}>
        <a href="/">
          <img src={imgLogo} className={styles.logoImg} alt="STERN" />
        </a>
      </div>

      <div className={styles.center}>
        <form
          className={styles.searchForm}
          onSubmit={handleSearchSubmit}
          autoComplete="off"
        >
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Buscar productos…"
            value={search}
            onChange={handleSearchChange}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
          />
        </form>

        {showSuggestions && (
          <div className={styles.searchSuggestions}>
            {searchLoading && (
              <div className={styles.searchSuggestionItemMuted}>
                Buscando…
              </div>
            )}

            {!searchLoading && suggestions.length === 0 && (
              <div className={styles.searchSuggestionItemMuted}>
                No se encontraron productos
              </div>
            )}

            {suggestions.map((prod) => (
              <button
                key={prod.product_id}
                type="button"
                className={styles.searchSuggestionItem}
                onClick={() => handleSuggestionClick(prod)}
              >
                <div className={styles.searchSuggestionMain}>
                  <span className={styles.searchSuggestionName}>
                    {prod.nombre}
                  </span>
                  <span className={styles.searchSuggestionCategory}>
                    {prod.categoria}
                  </span>
                </div>
                <span className={styles.searchSuggestionPrice}>
                  $
                  {Number(prod.precio || 0).toLocaleString('es-MX', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.right}>
        <CartButton />

        <button
          type="button"
          className={styles.hamburgerBtn}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden="true">{open ? '✕' : '☰'}</span>
        </button>
      </div>

      <nav
        id="mobile-menu"
        className={`${styles.mobileNav} ${
          open ? styles.mobileNavOpen : ''
        }`}
      >
        <ul className={styles.navList}>
          <li>
            <a
              className={styles.navLink}
              href="/perfil"
              onClick={handleLinkClick}
            >
              Mi Perfil
            </a>
          </li>
          <li>
            {/* usamos handleLogout aquí */}
            <button
              type="button"
              className={styles.navLink}
              id={styles.cerrarSesion}
              onClick={handleLogout}
            >
              Cerrar Sesión
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
}
