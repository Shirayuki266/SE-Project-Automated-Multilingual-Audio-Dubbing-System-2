import { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import 'leaflet/dist/leaflet.css';

const UserApp = lazy(() => import('./App.tsx'));
const AdminApp = lazy(() => import('./AdminApp.tsx'));

const isAdminRoute = window.location.pathname.startsWith('/admin');

createRoot(document.getElementById('root')!).render(
  <Suspense
    fallback={
      <div className="min-h-screen bg-[#f7f9f6] flex items-center justify-center text-sm text-[#5c7362]">
        Đang tải...
      </div>
    }
  >
    {isAdminRoute ? <AdminApp /> : <UserApp />}
  </Suspense>
);
