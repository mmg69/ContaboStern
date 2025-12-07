// ui/AdminDashboard.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { isValidElement, cloneElement } from 'react';
import { useRouter } from 'next/router';
import styles from '/styles/Dashboard.module.css';

const LogoStern = '/LogoStern.png';

/* ===================== Tipos ===================== */
interface Categoria {
  categoria_id: number;
  nombre: string;
  created_at?: string;
}

interface Producto {
  product_id: number;
  nombre: string;
  categoria: string;
  precio: number | string;
  cantidad_stock: number;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Cliente {
  customer_id: number;
  nombre: string;
  correo: string;
  telefono?: string | null;
  ciudad?: string | null;
  region?: string | null;
  pais?: string | null;
  activo?: boolean;
  fecha_alta?: string;
  created_at?: string;
  updated_at?: string;
}

interface DetalleVenta {
  order_item_id: number;
  product_id: number | null;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal_linea: number;
}

interface VentaRow {
  order_id: number;
  cliente: string;
  fecha: string;
  estado: 'pagado' | 'pendiente' | 'cancelado' | string;
  items: number;
  monto: number;
  detalle?: DetalleVenta[];
}

interface Stats {
  totalUsuarios: number;
  totalIngresos: number;
  totalPedidos: number;
  totalProductos: number;
}

/* ===================== Componente ===================== */
export default function AdminDashboard() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'usuarios' | 'ventas' | 'productos' | 'categorias'>('usuarios');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<any>(null);
  const [modalType, setModalType] = useState<string>('');

  const [usuariosData, setUsuariosData] = useState<Cliente[]>([]);
  const [ventasData, setVentasData] = useState<VentaRow[]>([]);
  const [productosData, setProductosData] = useState<Producto[]>([]);
  const [categoriasData, setCategoriasData] = useState<Categoria[]>([]);
  const [stats, setStats] = useState<Stats>({ totalUsuarios: 0, totalIngresos: 0, totalPedidos: 0, totalProductos: 0 });

  const [formData, setFormData] = useState<any>({});
  
  const [etlLoading, setEtlLoading] = useState(false);
  const [etlMessage, setEtlMessage] = useState('');
    // ETL temp -> dw
  const [dwLoading, setDwLoading] = useState(false);
  const [dwMessage, setDwMessage] = useState('');

  /* ========== Cargar datos ========== */
  async function loadAll() {
    const [p, c, v, s, cat] = await Promise.all([
      fetch('/api/productos').then(r => r.json()).catch(() => []),
      fetch('/api/clientes').then(r => r.json()).catch(() => []),
      fetch('/api/pedidos').then(r => r.json()).catch(() => []),
      fetch('/api/stats').then(r => r.json()).catch(() => ({})),
      fetch('/api/categorias').then(r => r.json()).catch(() => []),
    ]);

    setProductosData(Array.isArray(p) ? p : []);
    setUsuariosData(Array.isArray(c) ? c : []);
    setVentasData(Array.isArray(v) ? v : []);
    setCategoriasData(Array.isArray(cat) ? cat : []);
    setStats({
      totalUsuarios: s?.totalUsuarios ?? 0,
      totalIngresos: s?.totalIngresos ?? 0,
      totalPedidos: s?.totalPedidos ?? 0,
      totalProductos: s?.totalProductos ?? 0,
    });
  }

  useEffect(() => { loadAll().catch(console.error); }, []);

  /* ========== Helpers ========== */
  const handleLogout = () => router.push('/login/admin');

  const handleShowModal = (content: any, type: string) => {
    setModalContent(content);
    setModalType(type);

    if (type === 'editar-producto' && content) {
      setFormData({
        product_id: content.product_id,
        nombre: content.nombre,
        precio: content.precio,
        cantidad_stock: content.cantidad_stock,
        categoria: content.categoria,
        activo: content.activo ?? true,
      });
    } else if (type === 'agregar-producto') {
      setFormData({ nombre: '', precio: '', cantidad_stock: '', categoria: categoriasData[0]?.nombre || '' });
    } else if (type === 'agregar-categoria') {
      setFormData({ nombre: '' });
    } else if (type === 'editar-categoria' && content) {
      setFormData({ categoria_id: content.categoria_id, nombre: content.nombre });
    } else if (type === 'agregar-venta') {
      setFormData({
        customer_id: usuariosData[0]?.customer_id || '',
        product_id: productosData[0]?.product_id || '',
        cantidad: 1,
        estado: 'pagado',
      });
    } else if (type === 'editar-venta' && content) {
      const first = content?.detalle?.[0];
      setFormData({
        order_id: content.order_id,
        product_id: first?.product_id || productosData[0]?.product_id || '',
        cantidad: first?.cantidad || 1,
        estado: content.estado || 'pagado',
      });
    } else if (type === 'agregar-usuario') {
      setFormData({ nombre: '', correo: '', telefono: '', ciudad: '', region: '', pais: '' });
    } else if (type === 'editar-usuario' && content) {
      setFormData({
        customer_id: content.customer_id,
        nombre: content.nombre || '',
        correo: content.correo || '',
        telefono: content.telefono || '',
        ciudad: content.ciudad || '',
        region: content.region || '',
        pais: content.pais || '',
        activo: content.activo ?? true,
      });
    } else {
      setFormData({});
    }

    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalContent(null);
    setModalType('');
    setFormData({});
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    setFormData((prev: any) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const fmtMoney = (n: number | string) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n ?? 0));

  const fmtDate = (d: any) =>
    d ? new Date(d).toLocaleString('es-MX') : '—';

  const productosFiltrados = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return productosData;
    return productosData.filter((p: any) =>
      (p?.nombre ?? '').toLowerCase().includes(term) ||
      (p?.categoria ?? '').toLowerCase().includes(term)
    );
  }, [productosData, searchTerm]);
    // =================== ETL: stern_app -> temp ===================
  async function handleRunEtl() {
    const ok = window.confirm(
      'Esto tomará los datos actuales de stern_app (clientes, productos, pedidos, detalle_pedido) ' +
      'y los cargará/incrementará en el modelo estrella para preparar la funcion ETL. ¿Deseas continuar?'
    );
    if (!ok) return;

    try {
      setEtlLoading(true);
      setEtlMessage('Ejecutando ETL...');

      const res = await fetch('/api/etl-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok || !data.ok) {
        throw new Error(data?.error || 'Error al ejecutar ETL');
      }

      setEtlMessage(
        `ETL ejecutado. Dim Cliente: ${data.clientes ?? 0}, ` +
        `Dim Producto: ${data.productos ?? 0}, ` +
        `Dim Fecha: ${data.fechas ?? 0}, ` +
        `Ventas nuevas en fact_ventas: ${data.ventas ?? 0}.`
      );
    } catch (err: any) {
      console.error('ETL error:', err);
      alert(err?.message || 'Error al ejecutar ETL');
      setEtlMessage('Hubo un error al ejecutar el ETL.');
    } finally {
      setEtlLoading(false);
    }
  }
  // =================== ETL: temp -> dw (DataWarehouse) ===================
  async function handleRunDwEtl() {
    const ok = window.confirm(
      'Esto tomará los datos ya cargados en el esquema temp (modelo estrella) ' +
      'y los replicará en el esquema dw (DataWarehouse) para análisis OLAP. ¿Deseas continuar?'
    );
    if (!ok) return;

    try {
      setDwLoading(true);
      setDwMessage('Cargando datos al DataWarehouse (dw)...');

      const res = await fetch('/api/etl-dw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok || !data.ok) {
        throw new Error(data?.error || 'Error al ejecutar ETL temp -> dw');
      }

      setDwMessage(
        `DW actualizado. Dim Cliente: ${data.clientes ?? 0}, ` +
        `Dim Producto: ${data.productos ?? 0}, ` +
        `Dim Fecha: ${data.fechas ?? 0}, ` +
        `Fact Ventas: ${data.ventas ?? 0} filas.`
      );
    } catch (err: any) {
      console.error('ETL-DW error:', err);
      alert(err?.message || 'Error al actualizar DataWarehouse');
      setDwMessage('Hubo un error al ejecutar el ETL temp -> dw.');
    } finally {
      setDwLoading(false);
    }
  }

  /* ========== Acciones API ========== */
  // --- Usuarios: eliminar con hard → soft (fallback FK) ---
  async function submitEliminarUsuario(customer_id: number | bigint) {
    if (!window.confirm('¿Eliminar este usuario de forma permanente?')) return;

    // Intento HARD delete
    let res = await fetch('/api/clientes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id, mode: 'hard' }),
    });

    if (res.status === 204) {
      setUsuariosData(prev => prev.filter(u => u.customer_id !== Number(customer_id)));
      return;
    }

    // Si no fue 204, reviso si es 409 (FK)
    const data = await res.json().catch(() => ({}));
    if (res.status === 409 && (data?.code === 'FK_CONSTRAINT' || data?.error)) {
      const ok = window.confirm(
        'Este usuario tiene pedidos/devoluciones asociados.\n' +
        '¿Deseas desactivarlo (soft delete) para ocultarlo del uso?'
      );
      if (!ok) return;

      // Soft delete
      res = await fetch('/api/clientes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id, mode: 'soft' }),
      });

      if (!res.ok) {
        const d2 = await res.json().catch(() => ({}));
        return alert(d2?.error || 'No se pudo desactivar el usuario.');
      }

      // Reflejar activo=false en UI
      setUsuariosData(prev =>
        prev.map(u => u.customer_id === Number(customer_id) ? { ...u, activo: false } : u)
      );
      return;
    }

    alert(data?.error || 'No se pudo eliminar el usuario');
  }

  // Categorías
  async function submitCrearCategoria(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/categorias', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: formData.nombre }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return alert(data?.error || 'Error al crear categoría');
    setCategoriasData(prev => [data, ...prev]); handleCloseModal();
  }

  async function submitEditarCategoria(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/categorias', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoria_id: formData.categoria_id, nombre: formData.nombre }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return alert(data?.error || 'Error al editar categoría');
    setCategoriasData(prev => prev.map(c => c.categoria_id === data.categoria_id ? data : c)); handleCloseModal();
  }

  async function submitEliminarCategoria(categoria_id: number | bigint) {
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    const res = await fetch('/api/categorias', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoria_id }),
    });
    if (!res.ok) return alert('Error al eliminar categoría');
    setCategoriasData(prev => prev.filter(c => c.categoria_id !== Number(categoria_id)));
  }

  // Productos
  async function submitCrearProducto(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      nombre: formData.nombre,
      precio: Number(formData.precio),
      cantidad_stock: Number(formData.cantidad_stock),
      categoria: formData.categoria,
      image_url: (formData.image_url || '').trim(), // 👈 nuevo campo para el nombre de la imagen
    };
    const res = await fetch('/api/productos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return alert(data?.error || 'Error al crear producto');
    setProductosData(prev => [data, ...prev]);
    handleCloseModal();
  }

  async function submitEditarProducto(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/productos', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: formData.product_id,
        nombre: formData.nombre,
        precio: Number(formData.precio),
        cantidad_stock: Number(formData.cantidad_stock),
        categoria: formData.categoria,
        activo: !!formData.activo,
        image_url: (formData.image_url || '').trim(), // 👈 aquí también
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return alert(data?.error || 'Error al editar producto');
    setProductosData(prev => prev.map(p => p.product_id === data.product_id ? data : p));
    handleCloseModal();
  }
  // *** BORRADO DE PRODUCTO: HARD -> si 409 -> SOFT ***
  async function submitEliminarProducto(product_id: number | bigint) {
    if (!window.confirm('¿Eliminar este producto en la BD?')) return;

    // 1) Intento HARD
    let res = await fetch('/api/productos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id, mode: 'hard' }),
    });

    if (res.status === 204) {
      setProductosData(prev => prev.filter(p => p.product_id !== Number(product_id)));
      return;
    }

    // 2) Si no fue 204, reviso si es 409 (FK)
    const data = await res.json().catch(() => ({}));
    if (res.status === 409 && (data?.code === 'FK_CONSTRAINT' || data?.error)) {
      const ok = window.confirm('Este producto está referenciado en pedidos.\n¿Deseas darlo de baja (inactivo) para ocultarlo del catálogo?');
      if (!ok) return;

      // Soft delete
      res = await fetch('/api/productos', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id, mode: 'soft' }),
      });
      if (!res.ok) {
        const d2 = await res.json().catch(() => ({}));
        return alert(d2?.error || 'No se pudo dar de baja.');
      }
      setProductosData(prev => prev.map(p => p.product_id === Number(product_id) ? { ...p, activo: false } : p));
      return;
    }

    alert(data?.error || 'No se pudo eliminar el producto.');
  }

  // Ventas
  async function submitCrearVenta(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      customer_id: Number(formData.customer_id),
      estado: formData.estado || 'pagado',
      items: [{ product_id: Number(formData.product_id), cantidad: Number(formData.cantidad || 1) }],
    };
    const res = await fetch('/api/pedidos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return alert(data?.error || 'Error al crear venta');
    await loadAll(); handleCloseModal();
  }

  async function submitEditarVenta(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      order_id: Number(formData.order_id),
      estado: formData.estado,
      items: [{ product_id: Number(formData.product_id), cantidad: Number(formData.cantidad || 1) }],
    };
    const res = await fetch('/api/pedidos', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return alert(data?.error || 'Error al editar venta');
    await loadAll(); handleCloseModal();
  }

  async function submitEliminarVenta(order_id: number) {
    if (!window.confirm('¿Eliminar esta venta? Esto revertirá el stock.')) return;
    const res = await fetch('/api/pedidos', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return alert(data?.error || 'No se pudo eliminar la venta');
    }
    await loadAll();
  }

  // Usuarios
  async function submitCrearUsuario(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      nombre: formData.nombre,
      correo: formData.correo,
      telefono: formData.telefono || null,
      ciudad: formData.ciudad || null,
      region: formData.region || null,
      pais: formData.pais || null,
    };
    const res = await fetch('/api/clientes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return alert(data?.error || 'Error al crear usuario');
    setUsuariosData(prev => [data, ...prev]); handleCloseModal();
  }

  async function submitEditarUsuario(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      customer_id: formData.customer_id,
      nombre: formData.nombre,
      correo: formData.correo,
      telefono: formData.telefono || null,
      ciudad: formData.ciudad || null,
      region: formData.region || null,
      pais: formData.pais || null,
      activo: !!formData.activo,
    };
    const res = await fetch('/api/clientes', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return alert(data?.error || 'Error al editar usuario');
    setUsuariosData(prev => prev.map(u => u.customer_id === data.customer_id ? data : u)); handleCloseModal();
  }

  /* ========== UI helpers ========== */
  const Chip: React.FC<{ text: string; tone?: 'ok' | 'warn' | 'bad' }> = ({ text, tone }) => (
    <span className={`${styles.chip} ${tone ? styles[`chip_${tone}`] : ''}`}>{text}</span>
  );

  const DetailList: React.FC<{ data: { label: string; value: React.ReactNode }[] }> = ({ data }) => (
    <ul className={styles.detailList}>
      {data.map((it, i) => (
        <li key={i}><span>{it.label}</span><b>{it.value}</b></li>
      ))}
    </ul>
  );

  /* ========== Tabla ========== */
  const renderTable = () => {
    let headers: string[] = [];
    let rows: React.ReactNode[][] = [];
    let actions: React.ReactNode = null;

    if (activeTab === 'usuarios') {
      headers = ['Nombre', 'Email', 'Estatus', 'Fecha Registro', 'Acciones'];
      rows = usuariosData.map(u => ([
        u.nombre,
        u.correo,
        <Chip key={`chip-u-${u.customer_id}`} text={u.activo ? 'Activo' : 'Inactivo'} tone={u.activo ? 'ok' : 'warn'} />,
        fmtDate(u.created_at ?? u.fecha_alta),
        <div key={`usr-${u.customer_id}`} className={styles.actionButtons}>
          <button onClick={() => handleShowModal(u, 'editar-usuario')} className={styles.actionButton}>✏️</button>
          {/* Botón de eliminar con hard→soft */}
          <button onClick={() => submitEliminarUsuario(u.customer_id)} className={styles.actionButton}>🗑️</button>
        </div>
      ]));
      actions = (
        <div className={styles.tableActions}>
          <button onClick={() => handleShowModal(null, 'agregar-usuario')} className={styles.addButton}>➕ Agregar Usuario</button>
        </div>
      );
    }

    if (activeTab === 'ventas') {
      headers = ['Cliente', 'Monto', 'Fecha', 'Estado', 'Items', 'Acciones'];
      rows = ventasData.map(v => ([
        v.cliente,
        fmtMoney(v.monto),
        fmtDate(v.fecha),
        <Chip key={`chip-v-${v.order_id}`} text={v.estado} tone={v.estado === 'pagado' ? 'ok' : (v.estado === 'cancelado' ? 'bad' : 'warn')} />,
        v.items,
        <div key={`ven-${v.order_id}`} className={styles.actionButtons}>
          <button onClick={() => handleShowModal(v, 'ver-venta')} className={styles.actionButton}>👁️</button>
          <button onClick={() => handleShowModal(v, 'editar-venta')} className={styles.actionButton}>✏️</button>
          <button onClick={() => submitEliminarVenta(v.order_id)} className={styles.actionButton}>🗑️</button>
        </div>
      ]));
      actions = (
        <div className={styles.tableActions}>
          <button onClick={() => handleShowModal(null, 'agregar-venta')} className={styles.addButton}>➕ Agregar Venta</button>
        </div>
      );
    }

    if (activeTab === 'productos') {
      headers = ['Nombre', 'Precio', 'Stock', 'Categoría', 'Estatus', 'Acciones'];
      rows = productosFiltrados.map(p => ([
        p.nombre,
        fmtMoney(p.precio),
        p.cantidad_stock,
        p.categoria,
        <Chip key={`chip-p-${p.product_id}`} text={p.activo ? 'Activo' : 'Inactivo'} tone={p.activo ? 'ok' : 'warn'} />,
        <div key={`prd-${p.product_id}`} className={styles.actionButtons}>
          <button onClick={() => handleShowModal(p, 'ver-producto')} className={styles.actionButton}>👁️</button>
          <button onClick={() => handleShowModal(p, 'editar-producto')} className={styles.actionButton}>✏️</button>
          <button onClick={() => submitEliminarProducto(p.product_id)} className={styles.actionButton}>🗑️</button>
        </div>
      ]));
      actions = (
        <div className={styles.tableActions}>
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <button onClick={() => handleShowModal(null, 'agregar-producto')} className={styles.addButton}>➕ Agregar Producto</button>
        </div>
      );
    }

    if (activeTab === 'categorias') {
      headers = ['Nombre', 'Acciones'];
      rows = categoriasData.map(c => ([
        c.nombre,
        <div key={`cat-${c.categoria_id}`} className={styles.actionButtons}>
          <button onClick={() => handleShowModal(c, 'editar-categoria')} className={styles.actionButton}>✏️</button>
          <button onClick={() => submitEliminarCategoria(c.categoria_id)} className={styles.actionButton}>🗑️</button>
        </div>
      ]));
      actions = (
        <div className={styles.tableActions}>
          <button onClick={() => handleShowModal(null, 'agregar-categoria')} className={styles.addButton}>➕ Agregar Categoría</button>
        </div>
      );
    }

    return (
      <>
        {actions}
        <table className={styles.dataTable}>
          <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) =>
                  isValidElement(cell) ? cloneElement(cell as any, { key: j }) : <td key={j}>{cell}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  };

  /* ========== Render ========== */
  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <div className={styles.adminLogo}>
              <img src={LogoStern} alt="LogoStern" className={styles.logoStern} />
            </div>
            <h1 className={styles.headerTitle}>Panel de Administración</h1>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>Cerrar Sesión</button>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}><h3 className={styles.statLabel}>Usuarios Totales</h3><p className={styles.statValue}>{stats.totalUsuarios}</p></div>
          <div className={styles.statCard}><h3 className={styles.statLabel}>Total de Ingresos</h3><p className={styles.statValue}>{fmtMoney(stats.totalIngresos)}</p></div>
          <div className={styles.statCard}><h3 className={styles.statLabel}>Pedidos</h3><p className={styles.statValue}>{stats.totalPedidos}</p></div>
          <div className={styles.statCard}><h3 className={styles.statLabel}>Productos</h3><p className={styles.statValue}>{stats.totalProductos}</p></div>
        </div>
        {/* Barra para lanzar ETL */}
        <div className={styles.tableActions} style={{ marginTop: '1rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          {/* stern_app -> temp */}
          <button
            onClick={handleRunEtl}
            className={styles.addButton}
            disabled={etlLoading}
          >
            {etlLoading ? 'Ejecutando ETL a temp...' : '1) Exportar datos a temp (ETL)'}
          </button>

          {etlMessage && (
            <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', color: 'white' }}>
              {etlMessage}
            </span>
          )}

          {/* temp -> dw */}
          <button
            onClick={handleRunDwEtl}
            className={styles.addButton}
            disabled={dwLoading}
          >
            {dwLoading ? 'Cargando DW...' : '2) Cargar DataWarehouse (dw)'}
          </button>

          {dwMessage && (
            <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', color: 'white' }}>
              {dwMessage}
            </span>
          )}
        </div>


        <div className={styles.tabsGrid}>
          <button onClick={() => setActiveTab('usuarios')} className={`${styles.tabButton} ${activeTab === 'usuarios' ? styles.tabButtonActive : styles.tabButtonInactive}`}>Usuarios</button>
          <button onClick={() => setActiveTab('ventas')} className={`${styles.tabButton} ${activeTab === 'ventas' ? styles.tabButtonActive : styles.tabButtonInactive}`}>Ventas</button>
          <button onClick={() => setActiveTab('productos')} className={`${styles.tabButton} ${activeTab === 'productos' ? styles.tabButtonActive : styles.tabButtonInactive}`}>Productos</button>
          <button onClick={() => setActiveTab('categorias')} className={`${styles.tabButton} ${activeTab === 'categorias' ? styles.tabButtonActive : styles.tabButtonInactive}`}>Categorías</button>
        </div>

        <div className={styles.tableContainer}>{renderTable()}</div>
      </main>
      {/* Acción ETL */}

      {showModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={handleCloseModal}>×</button>
            <div className={styles.modalBody}>
              <h2 className={styles.modalTitle}>
                {modalType === 'agregar-usuario' && '➕ Agregar Usuario'}
                {modalType === 'editar-usuario' && '✏️ Editar Usuario'}
                {modalType === 'agregar-categoria' && '➕ Agregar Categoría'}
                {modalType === 'editar-categoria' && '✏️ Editar Categoría'}
                {modalType === 'agregar-producto' && '➕ Agregar Producto'}
                {modalType === 'editar-producto' && '✏️ Editar Producto'}
                {modalType === 'agregar-venta' && '➕ Agregar Venta'}
                {modalType === 'editar-venta' && '✏️ Editar Venta'}
                {modalType === 'ver-venta' && '👁️ Venta'}
                {modalType === 'ver-producto' && '👁️ Producto'}
              </h2>

              {/* Usuarios */}
              {modalType === 'agregar-usuario' && (
                <form onSubmit={submitCrearUsuario} className={styles.modalForm}>
                  <label>Nombre</label><br />
                  <input name="nombre" value={formData.nombre || ''} onChange={handleFormChange} required /><br />
                  <label>Correo electrónico</label><br />
                  <input type="email" name="correo" value={formData.correo || ''} onChange={handleFormChange} required /><br />
                  <label>Teléfono (opcional)</label><br />
                  <input name="telefono" value={formData.telefono || ''} onChange={handleFormChange} /><br />
                  <label>Ciudad</label><br />
                  <input name="ciudad" value={formData.ciudad || ''} onChange={handleFormChange} /><br />
                  <label>Región</label><br />
                  <input name="region" value={formData.region || ''} onChange={handleFormChange} /><br />
                  <label>País</label><br />
                  <input name="pais" value={formData.pais || ''} onChange={handleFormChange} /><br />
                  <button type="submit" className={styles.addButton}>Guardar Usuario</button>
                </form>
              )}

              {modalType === 'editar-usuario' && (
                <form onSubmit={submitEditarUsuario} className={styles.modalForm}>
                  <input type="hidden" name="customer_id" value={formData.customer_id} />
                  <label>Nombre</label><br />
                  <input name="nombre" value={formData.nombre || ''} onChange={handleFormChange} required /><br />
                  <label>Correo electrónico</label><br />
                  <input type="email" name="correo" value={formData.correo || ''} onChange={handleFormChange} required /><br />
                  <label>Teléfono (opcional)</label><br />
                  <input name="telefono" value={formData.telefono || ''} onChange={handleFormChange} /><br />
                  <label>Ciudad</label><br />
                  <input name="ciudad" value={formData.ciudad || ''} onChange={handleFormChange} /><br />
                  <label>Región</label><br />
                  <input name="region" value={formData.region || ''} onChange={handleFormChange} /><br />
                  <label>País</label><br />
                  <input name="pais" value={formData.pais || ''} onChange={handleFormChange} /><br />
                  <label><input type="checkbox" name="activo" checked={!!formData.activo} onChange={handleFormChange} />&nbsp;Activo</label>
                  <button type="submit" className={styles.addButton}>Guardar Cambios</button>
                </form>
              )}

              {/* Categorías */}
              {modalType === 'agregar-categoria' && (
                <form onSubmit={submitCrearCategoria} className={styles.modalForm}>
                  <label>Nombre</label><br />
                  <input name="nombre" value={formData.nombre || ''} onChange={handleFormChange} required /><br />
                  <button type="submit" className={styles.addButton}>Guardar</button>
                </form>
              )}

              {modalType === 'editar-categoria' && (
                <form onSubmit={submitEditarCategoria} className={styles.modalForm}>
                  <input type="hidden" name="categoria_id" value={formData.categoria_id} /><br />
                  <label>Nombre</label><br />
                  <input name="nombre" value={formData.nombre || ''} onChange={handleFormChange} required /><br />
                  <button type="submit" className={styles.addButton}>Guardar Cambios</button>
                </form>
              )}

              {/* Productos */}
              {modalType === 'agregar-producto' && (
                <form onSubmit={submitCrearProducto} className={styles.modalForm}>
                  <label>Nombre</label><br />
                  <input name="nombre" value={formData.nombre || ''} onChange={handleFormChange} required /><br />
                  <label>Precio</label><br />
                  <input name="precio" type="number" step="0.01" value={formData.precio || ''} onChange={handleFormChange} required /><br />
                  <label>Stock</label><br />
                  <input name="cantidad_stock" type="number" min={0} value={formData.cantidad_stock || ''} onChange={handleFormChange} required /><br />
                  <label>Categoría</label><br />
                  <select name="categoria" value={formData.categoria || ''} onChange={handleFormChange} required>
                    {categoriasData.map(c => <option key={c.categoria_id} value={c.nombre}>{c.nombre}</option>)}
                  </select>
                  <br />
                  <label>
                    Nombre del archivo de imagen
                    <br />

                    <input
                      type="text"
                      value={formData.image_url || ''}
                      onChange={(e) => setFormData(f => ({ ...f, image_url: e.target.value }))}
                      placeholder="ej. foco.jpg"
                    />
                  </label>
                  <button type="submit" className={styles.addButton}>Guardar</button>
                </form>
              )}

              {modalType === 'editar-producto' && (
                <form onSubmit={submitEditarProducto} className={styles.modalForm}>
                  <input type="hidden" name="product_id" value={formData.product_id} /><br />
                  <label>Nombre</label><br />
                  <input name="nombre" value={formData.nombre || ''} onChange={handleFormChange} required /><br />
                  <label>Precio</label><br />
                  <input name="precio" type="number" step="0.01" value={formData.precio || ''} onChange={handleFormChange} required /><br />
                  <label>Stock</label><br />
                  <input name="cantidad_stock" type="number" min={0} value={formData.cantidad_stock || ''} onChange={handleFormChange} required /><br />
                  <label>Categoría</label><br />
                  <select name="categoria" value={formData.categoria || ''} onChange={handleFormChange} required>
                    {categoriasData.map(c => <option key={c.categoria_id} value={c.nombre}>{c.nombre}</option>)}
                  </select><br />
                  <label><input type="checkbox" name="activo" checked={!!formData.activo} onChange={handleFormChange} />&nbsp;Activo</label>
                  <br />
                  <label>
                    Nombre del archivo de imagen
                    <br />

                    <input
                      type="text"
                      value={formData.image_url || ''}
                      onChange={(e) => setFormData(f => ({ ...f, image_url: e.target.value }))}
                      placeholder="ej. foco.jpg"
                    />
                  </label>
                  <button type="submit" className={styles.addButton}>Guardar Cambios</button>
                </form>
              )}

              {modalType === 'ver-producto' && modalContent && (
                <div className={styles.card}>
                  <DetailList
                    data={[
                      { label: 'Nombre', value: modalContent.nombre },
                      { label: 'Precio', value: fmtMoney(modalContent.precio) },
                      { label: 'Stock', value: modalContent.cantidad_stock },
                      { label: 'Categoría', value: modalContent.categoria },
                      { label: 'Estatus', value: modalContent.activo ? <Chip text="Activo" tone="ok" /> : <Chip text="Inactivo" tone="warn" /> },
                      { label: 'Creado', value: fmtDate(modalContent.created_at) },
                      { label: 'Imagen', value: modalContent.image_url ? <img src={`/images/${modalContent.image_url}`} className={styles.productImage} /> : '—' }
                    ]}
                  />
                </div>
              )}

              {/* Ventas */}
              {modalType === 'agregar-venta' && (
                <form onSubmit={submitCrearVenta} className={styles.modalForm}>
                  <label>Cliente</label><br />
                  <select name="customer_id" value={formData.customer_id || ''} onChange={handleFormChange} required>
                    {usuariosData.map(u => <option key={u.customer_id} value={u.customer_id}>{u.nombre} ({u.correo})</option>)}
                  </select><br />
                  <label>Producto</label><br />
                  <select name="product_id" value={formData.product_id || ''} onChange={handleFormChange} required>
                    {productosData.map(p => <option key={p.product_id} value={p.product_id}>{p.nombre} — {fmtMoney(p.precio)}</option>)}
                  </select><br />
                  <label>Cantidad</label><br />
                  <input name="cantidad" type="number" min={1} value={formData.cantidad || 1} onChange={handleFormChange} required /><br />
                  <label>Estado</label><br />
                  <select name="estado" value={formData.estado || 'pagado'} onChange={handleFormChange}>
                    <option value="pagado">pagado</option>
                    <option value="pendiente">pendiente</option>
                    <option value="cancelado">cancelado</option>
                  </select>
                  <button type="submit" className={styles.addButton}>Guardar</button>
                </form>
              )}

              {modalType === 'editar-venta' && modalContent && (
                <form onSubmit={submitEditarVenta} className={styles.modalForm}>
                  <input type="hidden" name="order_id" value={formData.order_id} />
                  <label>Producto</label><br />
                  <select name="product_id" value={formData.product_id || ''} onChange={handleFormChange} required>
                    {productosData.map(p => <option key={p.product_id} value={p.product_id}>{p.nombre} — {fmtMoney(p.precio)}</option>)}
                  </select><br />
                  <label>Cantidad</label><br />
                  <input name="cantidad" type="number" min={1} value={formData.cantidad || 1} onChange={handleFormChange} required /><br />
                  <label>Estado</label><br />
                  <select name="estado" value={formData.estado || 'pagado'} onChange={handleFormChange}>
                    <option value="pagado">pagado</option>
                    <option value="pendiente">pendiente</option>
                    <option value="cancelado">cancelado</option>
                  </select>
                  <button type="submit" className={styles.addButton}>Guardar</button>
                </form>
              )}

              {modalType === 'ver-venta' && modalContent && (
                <>
                  <div className={styles.card}>
                    <DetailList
                      data={[
                        { label: 'Cliente', value: modalContent.cliente },
                        { label: 'Estado', value: <Chip text={modalContent.estado} tone={modalContent.estado === 'pagado' ? 'ok' : (modalContent.estado === 'cancelado' ? 'bad' : 'warn')} /> },
                        { label: 'Fecha', value: fmtDate(modalContent.fecha) },
                        { label: 'Monto', value: fmtMoney(modalContent.monto) },
                        { label: 'Items', value: modalContent.items },
                      ]}
                    />
                  </div>
                  <div className={styles.card}>
                    <h3>Detalle</h3>
                    <table className={styles.dataTableSmall}>
                      <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead>
                      <tbody>
                        {(modalContent.detalle || []).map((d: DetalleVenta) => (
                          <tr key={d.order_item_id}>
                            <td>{d.nombre_producto}</td>
                            <td>{d.cantidad}</td>
                            <td>{fmtMoney(d.precio_unitario)}</td>
                            <td>{fmtMoney(d.subtotal_linea)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      )}


    </div>
  );
}
