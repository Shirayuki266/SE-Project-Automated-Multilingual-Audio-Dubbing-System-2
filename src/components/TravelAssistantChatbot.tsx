import React, { useState, useRef, useEffect } from 'react';
import { RichPOI } from '../server/types.js';
import { LanguageCode } from '../utils/audioSpeech.js';
import { UserLocationState } from '../hooks/useGPSTracker.js';
import {
  Sparkles,
  X,
  Send,
  Navigation,
  MapPin,
  Clock,
  Compass,
  Utensils,
  Coffee,
  Store,
  ExternalLink,
  ChevronRight,
  Bot,
  User,
  RotateCcw,
} from 'lucide-react';

interface TravelAssistantChatbotProps {
  pois: RichPOI[];
  currentLang: LanguageCode;
  userLocation: UserLocationState;
  onSelectPOI?: (poi: RichPOI, autoPlay?: boolean) => void;
}

interface ChatMessageItem {
  id: string;
  role: 'user' | 'model';
  text: string;
  suggestedRoute?: {
    poiId: string;
    poiTitle: string;
    distanceMeters: number;
    walkingTimeMinutes: number;
    googleMapsUrl: string;
  };
  nearbyPlaces?: Array<{
    name: string;
    category: 'vegetarian' | 'cafe' | 'convenience' | 'attraction';
    distance: string;
    description: string;
    address: string;
  }>;
  timestamp: string;
}

export const TravelAssistantChatbot: React.FC<TravelAssistantChatbotProps> = ({
  pois,
  currentLang,
  userLocation,
  onSelectPOI,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const initialWelcomeText =
    currentLang === 'en'
      ? 'Auspicious greetings! I am Tue Dang, your AI pilgrimage guide. Ask me for the shortest walking directions to any POI, temple hours, or nearby vegetarian dining in District 10.'
      : 'Nam Mô A Di Đà Phật! Tôi là Tuệ Đăng, trợ lý du lịch và dẫn đường thông minh tại Việt Nam Quốc Tự. Quý khách có thể hỏi đường đi ngắn nhất đến các điểm chiêm bái, giờ mở cửa hoặc quán cơm chay lân cận.';

  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'msg-welcome',
      role: 'model',
      text: initialWelcomeText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    { label: 'Đi đường nào đến Chánh Điện ngắn nhất?', query: 'Đi đường nào tới Chánh Điện ngắn nhất?' },
    { label: 'Đến Bảo Tháp 13 Tầng mất bao lâu?', query: 'Từ chỗ tôi đến Bảo Tháp 13 Tầng đi sao?' },
    { label: 'Quán cơm chay ngon gần chùa', query: 'Gợi ý quán cơm chay ngon gần Việt Nam Quốc Tự' },
    { label: 'Giờ mở cửa chùa hôm nay', query: 'Việt Nam Quốc Tự mở cửa từ mấy giờ đến mấy giờ?' },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsgId = 'msg-user-' + Date.now();
    const userMsg: ChatMessageItem = {
      id: userMsgId,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== 'msg-welcome')
        .slice(-6)
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          userLat: userLocation.latitude || undefined,
          userLng: userLocation.longitude || undefined,
          lang: currentLang,
          history,
        }),
      });

      const data = await res.json();

      const botMsgId = 'msg-bot-' + Date.now();
      const botMsg: ChatMessageItem = {
        id: botMsgId,
        role: 'model',
        text: data.reply || 'Cảm ơn quý khách đã hỏi thăm. Xin chúc quý khách một chuyến chiêm bái an lạc.',
        suggestedRoute: data.suggestedRoute,
        nearbyPlaces: data.nearbyPlaces,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.warn('[ChatbotUI] chat request notice:', err);
      const errorMsg: ChatMessageItem = {
        id: 'msg-err-' + Date.now(),
        role: 'model',
        text: 'Mô Phật! Tuệ Đăng đang bận kết nối máy chủ một chút, quý khách có thể đi thẳng qua Cổng Tam Quan và sân Đại Lễ để vào Chánh Điện nhé.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Action Button (Bottom Right) */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 pointer-events-auto">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group relative flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-[#2d5a37] via-[#1e3d25] to-[#2d5a37] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all border border-amber-300/40"
          title="Mở Trợ Lý Du Lịch & Dẫn Đường Tuệ Đăng"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-amber-300 animate-spin-slow" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
          </div>
          <span className="font-bold text-xs sm:text-sm tracking-wide">
            Trợ Lý Tuệ Đăng
          </span>
          <span className="bg-amber-400 text-[#19231b] font-bold text-[10px] px-2 py-0.5 rounded-full ml-0.5">
            AI Dẫn Đường
          </span>
        </button>
      </div>

      {/* Slide-over Chatbot Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-[#d8e6db] animate-slide-left">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1e3d25] to-[#2d5a37] text-white p-4 flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base flex items-center gap-2">
                    <span>Trợ Lý Tuệ Đăng</span>
                    <span className="text-[10px] bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 px-2 py-0.2 rounded-full font-sans">
                      Gemini 3.8 AI
                    </span>
                  </h3>
                  <p className="text-[11px] text-white/80">
                    Dẫn đường ngắn nhất & Tiện ích Việt Nam Quốc Tự
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Prompts Carousel */}
            <div className="bg-[#f0f6f2] p-2.5 border-b border-[#e2eae4] flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p.query)}
                  className="px-2.5 py-1 rounded-xl bg-white border border-[#d8e6db] hover:border-[#2d5a37] text-[11px] font-semibold text-[#2d5a37] whitespace-nowrap shadow-xs hover:bg-[#eef5f0] transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8fafc]">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'model' && (
                    <div className="w-7 h-7 rounded-xl bg-[#2d5a37] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Bot className="w-4 h-4 text-amber-300" />
                    </div>
                  )}

                  <div className={`max-w-[85%] space-y-2`}>
                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-[#2d5a37] text-white rounded-tr-xs shadow-xs'
                          : 'bg-white text-[#19231b] border border-[#e2eae4] rounded-tl-xs shadow-xs'
                      }`}
                    >
                      <div className="whitespace-pre-line">{m.text}</div>

                      {/* Route Card & Google Maps Directions Button */}
                      {m.suggestedRoute && (
                        <div className="mt-3 p-3 rounded-xl bg-[#f0f6f2] border border-[#cbe1d0] text-[#19231b] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#1e3d25] flex items-center gap-1">
                              <Compass className="w-3.5 h-3.5 text-[#2d5a37]" />
                              {m.suggestedRoute.poiTitle}
                            </span>
                            <span className="font-mono text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-[#cbe1d0]">
                              ~{m.suggestedRoute.distanceMeters}m
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-[#5c7362]">
                            <Clock className="w-3 h-3 text-[#2d5a37]" />
                            <span>Ước tính thời gian đi bộ: ~{m.suggestedRoute.walkingTimeMinutes} phút</span>
                          </div>

                          <div className="pt-1 flex flex-col gap-1.5">
                            <a
                              href={m.suggestedRoute.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs text-center shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              <span>Mở Google Maps Dẫn Đường</span>
                              <ExternalLink className="w-3 h-3 opacity-80" />
                            </a>

                            {onSelectPOI && (
                              <button
                                onClick={() => {
                                  const target = pois.find((p) => p.poi_id === m.suggestedRoute?.poiId);
                                  if (target) {
                                    onSelectPOI(target, true);
                                    setIsOpen(false);
                                  }
                                }}
                                className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-[#eef5f0] text-[#2d5a37] font-semibold text-xs border border-[#cbe1d0] flex items-center justify-center gap-1"
                              >
                                <span>Xem Điểm Trên Bản Đồ 3D</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Nearby Amenities Card */}
                      {m.nearbyPlaces && m.nearbyPlaces.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          <span className="block text-[11px] font-bold text-[#2d5a37] uppercase tracking-wider">
                            Tiện ích & Ẩm thực Chay Lân Cận:
                          </span>
                          <div className="space-y-1.5">
                            {m.nearbyPlaces.slice(0, 3).map((place, pIdx) => (
                              <div
                                key={pIdx}
                                className="p-2.5 rounded-xl bg-[#f7f9f6] border border-[#e2eae4] text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-[#19231b] flex items-center gap-1">
                                    {place.category === 'vegetarian' ? (
                                      <Utensils className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Store className="w-3 h-3 text-amber-600" />
                                    )}
                                    {place.name}
                                  </span>
                                  <span className="font-mono text-[10px] text-[#2d5a37] font-semibold">
                                    {place.distance}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#5c7362]">{place.description}</p>
                                <p className="text-[10px] text-[#7a8e80] italic">{place.address}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-[#a0b5a6] px-1">
                      {m.timestamp}
                    </div>
                  </div>

                  {m.role === 'user' && (
                    <div className="w-7 h-7 rounded-xl bg-[#eef5f0] text-[#2d5a37] flex items-center justify-center shrink-0 mt-0.5 border border-[#d8e6db]">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-[#5c7362] bg-white p-3 rounded-2xl border border-[#e2eae4] w-fit shadow-xs">
                  <Sparkles className="w-4 h-4 text-[#2d5a37] animate-spin" />
                  <span>Tuệ Đăng đang suy nghĩ và tính toán lộ trình...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Footer Input Bar */}
            <div className="p-3 bg-white border-t border-[#e2eae4] shrink-0 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Hỏi đường ngắn nhất, giờ mở cửa, quán chay..."
                  className="flex-1 px-4 py-2.5 rounded-full bg-[#f7f9f6] border border-[#e2eae4] text-xs sm:text-sm text-[#19231b] focus:border-[#2d5a37] focus:bg-white outline-hidden transition-all"
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isLoading}
                  className="w-10 h-10 rounded-full bg-[#2d5a37] hover:bg-[#23462b] disabled:opacity-40 text-white flex items-center justify-center shadow-md transition-all shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#7a8e80] px-2">
                <span>Vị trí GPS: {userLocation.latitude ? 'Đã bật' : 'Mặc định tâm chùa'}</span>
                <span>Ngôn ngữ: {currentLang.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
