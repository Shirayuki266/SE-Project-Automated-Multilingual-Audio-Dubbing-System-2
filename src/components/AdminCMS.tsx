import React, { useState } from 'react';
import { POI, Campus, Language } from '../types';
import {
  Shield,
  X,
  Lock,
  Plus,
  Edit2,
  Trash2,
  Volume2,
  QrCode,
  Download,
  Save,
  CheckCircle,
  RefreshCw,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import {
  adminLogin,
  adminUpdatePoi,
  adminCreatePoi,
  adminDeletePoi,
  adminGenerateTTS,
} from '../services/api';

interface AdminCMSProps {
  campus: Campus;
  pois: POI[];
  language: Language;
  onRefreshPois: () => void;
  onClose: () => void;
}

export const AdminCMS: React.FC<AdminCMSProps> = ({
  campus,
  pois,
  language,
  onRefreshPois,
  onClose,
}) => {
  const isVi = language === 'vi';
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('vnqt_admin_token'));
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('vietnamquoctu2026');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // POI Editing State
  const [editingPoi, setEditingPoi] = useState<POI | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [editTabLang, setEditTabLang] = useState<'vi' | 'en'>('vi');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // QR Modal State
  const [qrModalPoi, setQrModalPoi] = useState<POI | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const res = await adminLogin(username, password);
      setToken(res.access_token);
      localStorage.setItem('vnqt_admin_token', res.access_token);
    } catch (err: any) {
      setAuthError(err.message || 'Đăng nhập thất bại');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('vnqt_admin_token');
  };

  const handleOpenEdit = (poi: POI) => {
    setEditingPoi(JSON.parse(JSON.stringify(poi)));
    setIsCreating(false);
  };

  const handleOpenCreate = () => {
    const newPoi: POI = {
      poi_id: `vnqt_poi_${Date.now().toString().slice(-4)}`,
      code: `POI_0${pois.length + 1}`,
      campus_id: 'viet-nam-quoc-tu',
      latitude: 10.77185,
      longitude: 106.67135,
      geofence_radius: 18.0,
      location_type: 'outdoor',
      order_index: pois.length + 1,
      is_active: true,
      translations: {
        vi: { language_code: 'vi', title: '', description: '' },
        en: { language_code: 'en', title: '', description: '' },
      },
      media: [
        {
          image_url: '/static/images/vietnam_quoc_tu_overview.jpg',
          caption_vi: 'Khuôn viên chùa',
          caption_en: 'Temple complex',
          display_order: 1,
        },
      ],
    };
    setEditingPoi(newPoi);
    setIsCreating(true);
  };

  const handleSavePoi = async () => {
    if (!editingPoi || !token) return;
    setIsSaving(true);
    setStatusMsg(null);
    try {
      if (isCreating) {
        await adminCreatePoi(editingPoi, token);
      } else {
        await adminUpdatePoi(editingPoi.poi_id, editingPoi, token);
      }
      setStatusMsg('Lưu điểm tham quan thành công!');
      onRefreshPois();
      setEditingPoi(null);
    } catch (err: any) {
      setStatusMsg(`Lỗi: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePoi = async (poiId: string) => {
    if (!token || !window.confirm(`Xác nhận xóa POI ${poiId}?`)) return;
    try {
      await adminDeletePoi(poiId, token);
      onRefreshPois();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleGenerateTTS = async (poiId: string) => {
    if (!token) return;
    setStatusMsg('Đang kích hoạt Microsoft Edge-TTS tổng hợp giọng đọc...');
    try {
      await adminGenerateTTS(poiId, undefined, token);
      setStatusMsg('Đã tạo xong file âm thanh thuyết minh AI!');
      onRefreshPois();
    } catch (err: any) {
      setStatusMsg(`Lỗi tạo TTS: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative flex h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-[#fffdf9] shadow-2xl border border-amber-300 overflow-hidden text-stone-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#5c2b16] to-[#73371d] text-amber-100 shadow">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400 text-stone-900 shadow">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-amber-200">
                {isVi ? 'CMS Quản Trị – Việt Nam Quốc Tự' : 'Admin CMS – Vietnam Quoc Tu'}
              </h2>
              <p className="text-xs text-amber-300/80">
                {isVi ? 'Quản lý POI, Biên tập Đa Ngữ, Sinh Audio Edge-TTS & Xuất QR' : 'Manage POIs, Multilingual, Edge-TTS & QR'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {token && (
              <button
                onClick={handleLogout}
                className="text-xs text-amber-300 hover:text-white underline font-medium"
              >
                {isVi ? 'Đăng xuất' : 'Logout'}
              </button>
            )}
            <button onClick={onClose} className="p-1 rounded-full text-amber-200/80 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {!token ? (
            /* Login Form (UC07) */
            <div className="mx-auto mt-8 max-w-md rounded-3xl bg-white p-8 shadow-xl border border-amber-200">
              <div className="text-center mb-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-[#5c2b16] mb-3">
                  <Lock className="h-7 w-7" />
                </div>
                <h3 className="font-serif font-bold text-xl text-[#5c2b16]">
                  {isVi ? 'Đăng Nhập Quản Trị' : 'Admin Authentication'}
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  {isVi ? 'Tài khoản mặc định: admin / vietnamquoctu2026' : 'Default: admin / vietnamquoctu2026'}
                </p>
              </div>

              {authError && (
                <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 font-medium">
                  {authError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {isVi ? 'Tên đăng nhập' : 'Username'}
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {isVi ? 'Mật khẩu' : 'Password'}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full rounded-xl bg-gradient-to-r from-[#5c2b16] to-[#803c1f] py-3 text-sm font-bold text-amber-100 shadow-md hover:brightness-110 active:scale-98 transition-all"
                >
                  {isLoggingIn ? (
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto" />
                  ) : isVi ? (
                    'Đăng Nhập'
                  ) : (
                    'Login'
                  )}
                </button>
              </form>
            </div>
          ) : editingPoi ? (
            /* POI Edit Form (UC09, UC10) */
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-amber-200">
                <h3 className="font-serif font-bold text-lg text-[#5c2b16]">
                  {isCreating
                    ? isVi ? 'Thêm Điểm Tham Quan Mới' : 'Create New POI'
                    : isVi ? `Chỉnh Sửa: ${editingPoi.code} - ${editingPoi.translations.vi.title}` : `Edit POI: ${editingPoi.code}`}
                </h3>
                <button
                  onClick={() => setEditingPoi(null)}
                  className="text-xs font-semibold text-stone-500 hover:text-stone-800"
                >
                  ← {isVi ? 'Quay lại danh sách' : 'Back to list'}
                </button>
              </div>

              {statusMsg && (
                <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span>{statusMsg}</span>
                </div>
              )}

              {/* Coordinates & Geofencing Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-2xl bg-amber-50/50 p-4 border border-amber-200">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Vĩ độ (Latitude)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={editingPoi.latitude}
                    onChange={(e) =>
                      setEditingPoi({ ...editingPoi, latitude: parseFloat(e.target.value) })
                    }
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Kinh độ (Longitude)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={editingPoi.longitude}
                    onChange={(e) =>
                      setEditingPoi({ ...editingPoi, longitude: parseFloat(e.target.value) })
                    }
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-stone-700">
                      Bán kính Geofence: {editingPoi.geofence_radius}m
                    </label>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="30"
                    step="1"
                    value={editingPoi.geofence_radius}
                    onChange={(e) =>
                      setEditingPoi({ ...editingPoi, geofence_radius: parseFloat(e.target.value) })
                    }
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Multilingual Tabs */}
              <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
                  <button
                    onClick={() => setEditTabLang('vi')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      editTabLang === 'vi'
                        ? 'bg-[#5c2b16] text-amber-200 shadow'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    🇻🇳 Tiếng Việt
                  </button>
                  <button
                    onClick={() => setEditTabLang('en')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      editTabLang === 'en'
                        ? 'bg-[#5c2b16] text-amber-200 shadow'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    🇬🇧 English
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {editTabLang === 'vi' ? 'Tiêu đề Di tích (VI)' : 'Relic Title (EN)'}
                  </label>
                  <input
                    type="text"
                    value={editingPoi.translations[editTabLang]?.title || ''}
                    onChange={(e) => {
                      const updated = { ...editingPoi.translations };
                      updated[editTabLang].title = e.target.value;
                      setEditingPoi({ ...editingPoi, translations: updated });
                    }}
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2 text-sm focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {editTabLang === 'vi' ? 'Nội dung thuyết minh (VI)' : 'Audio Narration Script (EN)'}
                  </label>
                  <textarea
                    rows={4}
                    value={editingPoi.translations[editTabLang]?.description || ''}
                    onChange={(e) => {
                      const updated = { ...editingPoi.translations };
                      updated[editTabLang].description = e.target.value;
                      setEditingPoi({ ...editingPoi, translations: updated });
                    }}
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 p-3 text-xs leading-relaxed focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-amber-200">
                <button
                  type="button"
                  onClick={() => handleGenerateTTS(editingPoi.poi_id)}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 px-4 py-2.5 text-xs font-bold text-amber-900 border border-amber-400 hover:bg-amber-500/30"
                >
                  <Volume2 className="h-4 w-4 text-amber-700" />
                  <span>Tạo giọng đọc Edge-TTS</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPoi(null)}
                    className="rounded-xl px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-100"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePoi}
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow hover:brightness-110"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSaving ? 'Đang lưu...' : 'Lưu Điểm Tham Quan'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* POI Table View (UC08, UC09, UC11) */
            <div className="space-y-6">
              {/* Top Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-2 text-xs font-bold text-white shadow hover:brightness-110 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Thêm POI Mới</span>
                  </button>

                  <a
                    href="/api/v1/pois/qr/batch-zip"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-amber-200 shadow hover:bg-stone-800 transition-all"
                  >
                    <Download className="h-4 w-4" />
                    <span>Tải ZIP Tất Cả Mã QR (In Biển Đồng)</span>
                  </a>
                </div>

                <div className="text-xs text-stone-500 font-medium">
                  Tổng cộng: <span className="font-bold text-[#5c2b16]">{pois.length} di tích</span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-amber-50 text-amber-950 border-b border-amber-200 text-[11px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Mã / STT</th>
                      <th className="px-4 py-3">Tên Di Tích (VI / EN)</th>
                      <th className="px-4 py-3">Vị Trí & Bán Kính</th>
                      <th className="px-4 py-3">Audio Edge-TTS</th>
                      <th className="px-4 py-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {pois.map((poi) => (
                      <tr key={poi.poi_id} className="hover:bg-amber-50/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-stone-900">
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900">
                            {poi.code}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <div className="font-bold text-[#5c2b16] truncate">
                            {poi.translations.vi.title}
                          </div>
                          <div className="text-[11px] text-stone-500 truncate">
                            {poi.translations.en.title}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-stone-700">
                            R = {poi.geofence_radius}m
                          </span>
                          <span className="ml-2 text-[10px] text-stone-400">
                            ({poi.location_type})
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                            <span className="text-[11px] text-stone-600 font-medium">VI + EN</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* QR Code */}
                            <button
                              onClick={() => setQrModalPoi(poi)}
                              title="Xem & Xuất mã QR"
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 transition-all"
                            >
                              <QrCode className="h-4 w-4" />
                            </button>
                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEdit(poi)}
                              title="Chỉnh sửa"
                              className="p-1.5 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 transition-all"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => handleDeletePoi(poi.poi_id)}
                              title="Xóa"
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Single POI QR Modal (UC11) */}
        {qrModalPoi && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-4 animate-in fade-in">
            <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-amber-300 text-center">
              <button
                onClick={() => setQrModalPoi(null)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 mb-2">
                <QrCode className="h-6 w-6" />
              </div>

              <h4 className="font-serif font-bold text-base text-[#5c2b16]">
                {qrModalPoi.translations.vi.title}
              </h4>
              <p className="text-xs text-stone-500 mb-4">
                Mã QR chuẩn dùng để in biển đồng dán thực địa
              </p>

              {/* QR Image Preview */}
              <div className="mx-auto h-52 w-52 overflow-hidden rounded-2xl border-2 border-amber-200 p-2 bg-[#fffcf5] shadow-inner mb-4 flex items-center justify-center">
                <img
                  src={qrModalPoi.qr_code_url || `/api/v1/pois/${qrModalPoi.poi_id}/qr?format=png`}
                  alt="QR Code"
                  className="h-full w-full object-contain"
                />
              </div>

              {/* Download Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`/api/v1/pois/${qrModalPoi.poi_id}/qr?format=png`}
                  download={`qr_${qrModalPoi.poi_id}.png`}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-stone-950 shadow hover:bg-amber-400"
                >
                  <Download className="h-4 w-4" />
                  <span>Tải PNG</span>
                </a>
                <a
                  href={`/api/v1/pois/${qrModalPoi.poi_id}/qr?format=svg`}
                  download={`qr_${qrModalPoi.poi_id}.svg`}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 py-2.5 text-xs font-bold text-white shadow hover:bg-stone-800"
                >
                  <Download className="h-4 w-4" />
                  <span>Tải Vector SVG</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
