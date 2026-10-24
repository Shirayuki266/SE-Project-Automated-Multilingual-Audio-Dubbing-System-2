const loginPanel = document.getElementById('loginPanel');
const dashboardPanel = document.getElementById('dashboardPanel');
const loginForm = document.getElementById('loginForm');
const poiForm = document.getElementById('poiForm');
const poiTable = document.getElementById('poiTable');
const poiCount = document.getElementById('poiCount');

const AUTH_KEY = 'vnqt_admin_token';

function getToken() {
  return localStorage.getItem(AUTH_KEY) || '';
}

function setToken(token) {
  if (!token) {
    localStorage.removeItem(AUTH_KEY);
    return;
  }
  localStorage.setItem(AUTH_KEY, token);
}

function renderAuthState() {
  const isLoggedIn = Boolean(getToken());
  loginPanel.classList.toggle('hidden', isLoggedIn);
  dashboardPanel.classList.toggle('hidden', !isLoggedIn);
}

async function apiFetch(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body: options.body && !(options.body instanceof FormData) ? JSON.stringify(options.body) : options.body,
  });

  if (!response.ok) {
    let detail = 'Yêu cầu không thành công';
    try {
      const data = await response.json();
      detail = data.detail || detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function login(event) {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const payload = {
    login: formData.get('login'),
    password: formData.get('password'),
  };

  try {
    const result = await apiFetch('/api/v1/auth/login', {
      method: 'POST',
      body: payload,
    });
    setToken(result.access_token);
    renderAuthState();
    await loadPois();
  } catch (error) {
    alert(error.message || 'Đăng nhập thất bại');
  }
}

async function logout() {
  try {
    await apiFetch('/api/v1/auth/logout', { method: 'POST' });
  } catch (error) {
    console.warn('Logout request failed', error);
  } finally {
    setToken('');
    renderAuthState();
    poiTable.innerHTML = '';
    poiCount.textContent = '0 POI';
  }
}

async function loadPois() {
  try {
    const result = await apiFetch('/api/v1/campuses/viet-nam-quoc-tu/pois');
    const items = result.pois || [];
    poiCount.textContent = `${items.length} POI`;
    poiTable.innerHTML = items.length
      ? items
          .map(
            (poi) => `
              <div class="poi-row">
                <div class="row-meta">
                  <strong>${poi.title_vi || poi.title_en}</strong>
                  <small>${poi.location_type} · ${poi.geofence_radius}m</small>
                </div>
                <div class="row-meta">
                  <small>Lat: ${poi.latitude}</small>
                  <small>Lng: ${poi.longitude}</small>
                </div>
                <div class="row-meta">
                  <small>${poi.is_active ? 'Đang hiển thị' : 'Đang ẩn'}</small>
                </div>
                <div class="row-actions">
                  <button class="danger" type="button" data-delete="${poi.id}">Xóa</button>
                </div>
              </div>
            `,
          )
          .join('')
      : '<p>Chưa có POI nào.</p>';

    poiTable.querySelectorAll('[data-delete]').forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          await apiFetch(`/api/v1/admin/pois/${button.dataset.delete}`, { method: 'DELETE' });
          await loadPois();
        } catch (error) {
          alert(error.message || 'Xóa POI thất bại');
        }
      });
    });
  } catch (error) {
    poiTable.innerHTML = `<p>${error.message}</p>`;
  }
}

async function createPoi(event) {
  event.preventDefault();
  const formData = new FormData(poiForm);
  const payload = {
    title_vi: formData.get('title_vi'),
    title_en: formData.get('title_en') || null,
    description_vi: formData.get('description_vi'),
    description_en: formData.get('description_en') || null,
    latitude: Number(formData.get('latitude')),
    longitude: Number(formData.get('longitude')),
    geofence_radius: Number(formData.get('geofence_radius')),
    location_type: formData.get('location_type') || 'OUTDOOR',
    is_active: true,
    display_order: 0,
  };

  try {
    await apiFetch('/api/v1/admin/pois', {
      method: 'POST',
      body: payload,
    });
    poiForm.reset();
    await loadPois();
  } catch (error) {
    alert(error.message || 'Không thể tạo POI');
  }
}

loginForm.addEventListener('submit', login);
poiForm.addEventListener('submit', createPoi);
document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('reloadBtn').addEventListener('click', loadPois);

renderAuthState();
if (getToken()) {
  loadPois();
}
