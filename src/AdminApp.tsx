import { useEffect, useState, useCallback } from 'react';
import { RichPOI } from './server/types.js';
import { AdminPortal } from './components/AdminPortal.tsx';

export default function AdminApp() {
  const [pois, setPois] = useState<RichPOI[]>([]);

  const fetchPOIs = useCallback(async () => {
    try {
      const res = await fetch('/api/pois');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setPois(data.data);
      }
    } catch (e) {
      console.warn('Failed to fetch POIs:', e);
    }
  }, []);

  useEffect(() => {
    fetchPOIs();
  }, [fetchPOIs]);

  return (
    <AdminPortal
      pois={pois}
      currentLang="vi"
      onClose={() => {
        window.location.href = '/';
      }}
      onRefreshPOIs={fetchPOIs}
    />
  );
}
