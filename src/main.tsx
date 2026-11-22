import { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import 'leaflet/dist/leaflet.css';

// Đăng ký Service Worker trong môi trường Production (PWA Offline Capability)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('⚡ [PWA] Ứng dụng đã có bản cập nhật mới.');
    },
    onOfflineReady() {
      console.log('⚡ [PWA] Ứng dụng đã sẵn sàng hoạt động ngoại tuyến (Offline Ready).');
    },
  });
}

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
