import React, { useState } from 'react';
import { UserProfile, Language, POI } from '../types';
import {
  User,
  X,
  Lock,
  Sparkles,
  Heart,
  CheckCircle2,
  Send,
  LogOut,
  RefreshCw,
  Phone,
  BookOpen,
} from 'lucide-react';
import { userLogin, userRegister, syncUserVisited, addUserWish } from '../services/api';

interface UserAccountModalProps {
  currentUser: UserProfile | null;
  pois: POI[];
  visitedPoiIds: Set<string>;
  language: Language;
  onLoginSuccess: (user: UserProfile, token: string) => void;
  onLogout: () => void;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onClose: () => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  currentUser,
  pois,
  visitedPoiIds,
  language,
  onLoginSuccess,
  onLogout,
  onUpdateUser,
  onClose,
}) => {
  const isVi = language === 'vi';
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Form states
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [dharmaName, setDharmaName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Wish state
  const [wishInput, setWishInput] = useState<string>('');
  const [isSendingWish, setIsSendingWish] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Quick Login with sample account
  const handleQuickLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await userLogin('phattu', '123456');
      localStorage.setItem('vnqt_user_token', res.access_token);
      onLoginSuccess(res.user, res.access_token);
    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng nhập mẫu thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await userLogin(username, password);
      localStorage.setItem('vnqt_user_token', res.access_token);
      onLoginSuccess(res.user, res.access_token);
    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await userRegister({
        username,
        password,
        full_name: fullName,
        dharma_name: dharmaName,
        phone,
      });
      localStorage.setItem('vnqt_user_token', res.access_token);
      onLoginSuccess(res.user, res.access_token);
    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng ký thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncVisited = async () => {
    const token = localStorage.getItem('vnqt_user_token');
    if (!token || !currentUser) return;
    setIsSyncing(true);
    try {
      const res = await syncUserVisited(Array.from(visitedPoiIds), token);
      onUpdateUser({ ...currentUser, visited_pois: res.visited_pois });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishInput.trim()) return;
    const token = localStorage.getItem('vnqt_user_token');
    if (!token || !currentUser) return;
    setIsSendingWish(true);
    try {
      const res = await addUserWish(wishInput, token);
      onUpdateUser({ ...currentUser, wishes: res.wishes });
      setWishInput('');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSendingWish(false);
    }
  };

  // Calculate completed stamps
  const userVisitedSet = new Set(currentUser?.visited_pois || []);
  const mergedVisitedSet = new Set([...Array.from(userVisitedSet), ...Array.from(visitedPoiIds)]);
  const completionPercentage = pois.length > 0 ? Math.round((mergedVisitedSet.size / pois.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative flex h-[88vh] w-full max-w-md flex-col rounded-3xl bg-gradient-to-b from-[#fffdf9] to-[#f7f0e6] shadow-2xl border border-amber-300 overflow-hidden text-stone-800">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#5c2b16] to-[#75371c] text-amber-100 shadow">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-stone-900 shadow">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-amber-200">
                {currentUser
                  ? isVi ? 'Hộ Chiếu Chiêm Bái Phật Tử' : 'Pilgrim Passport'
                  : isVi ? 'Tài Khoản Khách Tham Quan' : 'Visitor Account'}
              </h3>
              <p className="text-[10px] text-amber-300/80">
                {currentUser
                  ? isVi ? 'Lưu dấu ấn hành trình & Sổ nguyện tâm linh' : 'Track your journey & spiritual wishes'
                  : isVi ? 'Đăng nhập để lưu dấu ấn hành trình' : 'Login to save your pilgrimage progress'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-amber-200/80 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!currentUser ? (
            /* Login / Register Forms */
            <div className="space-y-4 animate-in fade-in">
              {/* Tabs */}
              <div className="flex rounded-2xl bg-amber-100/60 p-1 border border-amber-200">
                <button
                  onClick={() => setTab('login')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    tab === 'login' ? 'bg-[#5c2b16] text-amber-200 shadow' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {isVi ? 'Đăng Nhập' : 'Login'}
                </button>
                <button
                  onClick={() => setTab('register')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    tab === 'register' ? 'bg-[#5c2b16] text-amber-200 shadow' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {isVi ? 'Đăng Ký Phật Tử' : 'Register'}
                </button>
              </div>

              {/* 1-Click Quick Demo Login */}
              {tab === 'login' && (
                <button
                  type="button"
                  onClick={handleQuickLogin}
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500/20 border border-amber-400 py-2.5 text-xs font-bold text-amber-950 hover:bg-amber-500/30 active:scale-98 transition-all"
                >
                  <Sparkles className="h-4 w-4 text-amber-700" />
                  <span>⚡ {isVi ? 'Đăng nhập nhanh (Phật tử Diệu Thiện)' : 'Quick Login (Demo Pilgrim)'}</span>
                </button>
              )}

              {errorMsg && (
                <div className="rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200 font-medium">
                  {errorMsg}
                </div>
              )}

              {tab === 'login' ? (
                /* Login Form */
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {isVi ? 'Tên đăng nhập' : 'Username'}
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="phattu"
                      required
                      className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                      placeholder="••••••"
                      required
                      className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-[#5c2b16] to-[#75371c] py-2.5 text-xs font-bold text-amber-100 shadow hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                  >
                    {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                    <span>{isVi ? 'Đăng Nhập' : 'Sign In'}</span>
                  </button>
                </form>
              ) : (
                /* Register Form */
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {isVi ? 'Tên tài khoản (*)' : 'Username (*)'}
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {isVi ? 'Mật khẩu (*)' : 'Password (*)'}
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {isVi ? 'Họ và tên (*)' : 'Full Name (*)'}
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Nguyễn Văn An"
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        {isVi ? 'Pháp danh' : 'Dharma Name'}
                      </label>
                      <input
                        type="text"
                        value={dharmaName}
                        onChange={(e) => setDharmaName(e.target.value)}
                        placeholder="Diệu Thiện"
                        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        {isVi ? 'Số điện thoại' : 'Phone'}
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0901234567"
                        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 py-2.5 text-xs font-bold text-white shadow hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                  >
                    {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    <span>{isVi ? 'Tạo Tài Khoản Phật Tử' : 'Create Account'}</span>
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* Logged In: Pilgrim Passport & Profile */
            <div className="space-y-4 animate-in fade-in">
              {/* Pilgrim Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#5c2b16] via-[#75371c] to-[#421b0c] p-4 text-amber-100 shadow-lg border border-amber-400/40">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-amber-400/20 p-1 border border-amber-300/40 flex items-center justify-center">
                    <img src="/lotus.svg" alt="Lotus" className="h-8 w-8" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">
                        {isVi ? 'HỘ CHIẾU PHẬT TỬ' : 'PILGRIM PASSPORT'}
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-base text-amber-200 truncate">
                      {currentUser.dharma_name && currentUser.dharma_name !== 'Chưa có pháp danh'
                        ? `Phật tử: ${currentUser.dharma_name}`
                        : currentUser.full_name}
                    </h4>
                    <p className="text-[11px] text-amber-300/70 truncate">{currentUser.full_name}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-amber-200">
                      {isVi ? 'Tiến độ chiêm bái di tích:' : 'Pilgrimage Progress:'}
                    </span>
                    <span className="text-amber-300 font-bold">
                      {mergedVisitedSet.size}/{pois.length} ({completionPercentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500 rounded-full"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Sync Button */}
              <button
                onClick={handleSyncVisited}
                disabled={isSyncing}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-50 border border-amber-300 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 active:scale-98 transition-all"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-amber-700 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isVi ? 'Đồng bộ dấu ấn hành trình vừa đi' : 'Sync newly visited POIs'}</span>
              </button>

              {/* Pilgrim Stamps (Dấu Ấn Chiêm Bái) */}
              <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
                <h5 className="font-serif font-bold text-xs text-[#5c2b16] mb-2.5 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{isVi ? 'Dấu Ấn Hành Trình Chiêm Bái (Stamps)' : 'Pilgrimage Stamps'}</span>
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  {pois.map((poi) => {
                    const isChecked = mergedVisitedSet.has(poi.poi_id);
                    const trans = poi.translations[language] || poi.translations.vi;

                    return (
                      <div
                        key={poi.poi_id}
                        className={`rounded-xl p-2.5 text-left border flex items-center gap-2 transition-all ${
                          isChecked
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-xs'
                            : 'bg-stone-50 border-stone-200 text-stone-400 opacity-60'
                        }`}
                      >
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            isChecked ? 'bg-emerald-600 text-white shadow' : 'bg-stone-200 text-stone-500'
                          }`}
                        >
                          {isChecked ? '✓' : poi.order_index}
                        </div>
                        <div className="truncate">
                          <p className="text-[11px] font-bold truncate leading-tight">
                            {trans.title.split('–')[0].trim()}
                          </p>
                          <span className="text-[9px] font-medium">
                            {isChecked ? (isVi ? 'Đã chiêm bái' : 'Visited') : isVi ? 'Chưa ghé' : 'Not yet'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Spiritual Wishes / Lời Nguyện Tâm Linh */}
              <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm space-y-3">
                <h5 className="font-serif font-bold text-xs text-[#5c2b16] flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-rose-600" />
                  <span>{isVi ? 'Sổ Nguyện Ước Tâm Linh (Cầu An)' : 'Spiritual Wishbook'}</span>
                </h5>

                <form onSubmit={handleSendWish} className="flex gap-2">
                  <input
                    type="text"
                    value={wishInput}
                    onChange={(e) => setWishInput(e.target.value)}
                    placeholder={isVi ? 'Viết lời nguyện cầu an cho gia đình...' : 'Write your prayer or wish...'}
                    className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={isSendingWish || !wishInput.trim()}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white shadow hover:bg-amber-500 active:scale-95 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>

                {/* Wishes List */}
                {currentUser.wishes && currentUser.wishes.length > 0 && (
                  <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                    {currentUser.wishes.map((w, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-amber-50/70 p-2 text-[11px] text-amber-950 border border-amber-200/60 leading-relaxed"
                      >
                        🪷 {w}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-stone-100 py-2.5 text-xs font-bold text-stone-600 hover:bg-rose-50 hover:text-rose-700 transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span>{isVi ? 'Đăng Xuất Tài Khoản' : 'Log Out'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
