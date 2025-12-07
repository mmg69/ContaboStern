// pages/admin/index.tsx
import dynamic from 'next/dynamic';

// Cargamos el dashboard en cliente (usa window/localStorage/modales)
const AdminDashboard = dynamic(() => import('../admin/ui/AdminDashboard'), { ssr: false });

export default function AdminPage() {
  return <AdminDashboard />;
}
