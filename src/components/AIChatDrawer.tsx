import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, User, RefreshCw } from 'lucide-react';
import { Language, ChatMessage, POI } from '../types';
import { askBuddhistAI } from '../services/api';

interface AIChatDrawerProps {
  language: Language;
  currentPoi: POI | null;
  onClose: () => void;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  language,
  currentPoi,
  onClose,
}) => {
  const isVi = language === 'vi';
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: isVi
        ? 'Nam Mô Bổn Sư Thích Ca Mâu Ni Phật. Tôi là Pháp Hỷ - trợ lý ảo hướng dẫn viên Phật giáo tại Việt Nam Quốc Tự. Quý Phật tử và du khách có điều gì cần tìm hiểu về lịch sử, kiến trúc, đại tượng Phật 35 tấn hay xá lợi Trái tim Bồ tát Thích Quảng Đức không ạ?'
        : 'Namo Amitabha Buddha. I am Phap Hy, your virtual Buddhist guide at Vietnam Quoc Tu. Feel free to ask about the temple history, the 13-Storey Stupa, the 35-ton bronze Buddha, or Buddhist teachings and etiquette.',
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>(
    isVi
      ? [
          'Ý nghĩa lịch sử của Bảo Tháp 13 tầng?',
          'Pho tượng Phật 35 tấn trong Chánh Điện?',
          'Lịch sử Trái tim Bất diệt Bồ tát Thích Quảng Đức?',
          'Quy tắc trang nghiêm khi vào chùa?',
        ]
      : [
          'What is the significance of the 13-Storey Stupa?',
          'Tell me about the 35-ton bronze Buddha',
          'The immortal heart relic of Thich Quang Duc',
          'Visiting etiquette and rules at the temple',
        ]
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-5).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await askBuddhistAI(
        query,
        language,
        currentPoi?.poi_id,
        historyPayload
      );

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
      if (res.suggested_questions && res.suggested_questions.length > 0) {
        setSuggestions(res.suggested_questions);
      }
    } catch (err) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: isVi
          ? 'Mô Phật, có chút gián đoạn kết nối. Quý vị hoan hỷ thử lại sau giây lát.'
          : 'Pardon, connection interrupted. Please try again in a moment.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="relative flex h-[85vh] w-full max-w-lg flex-col rounded-t-3xl sm:rounded-3xl bg-gradient-to-b from-[#fffcf8] to-[#f5ede3] shadow-2xl border border-amber-300/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#5c2b16] via-[#75371c] to-[#421b0c] text-amber-100 shadow">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400 text-stone-950 shadow-md">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-amber-200">
                  {isVi ? 'Pháp Hỷ – Tuệ Giác AI' : 'Phap Hy – Buddhist AI'}
                </h3>
                <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-300/30">
                  Gemini 2.5 Flash
                </span>
              </div>
              <p className="text-[10px] text-amber-200/80">
                {isVi ? 'Trợ lý ảo thuyết minh & đạo lý nhà Phật' : 'Virtual Spiritual Guide Assistant'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-amber-200/80 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((m) => {
            const isBot = m.role === 'assistant';
            return (
              <div
                key={m.id}
                className={`flex gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {isBot && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white shadow">
                    <Bot className="h-4 w-4 text-amber-200" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm ${
                    isBot
                      ? 'bg-white text-stone-800 border border-amber-200/80 rounded-tl-sm'
                      : 'bg-gradient-to-r from-[#5c2b16] to-[#75371c] text-amber-100 rounded-tr-sm'
                  }`}
                >
                  <p className="whitespace-pre-line text-justify">{m.content}</p>
                </div>
                {!isBot && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#5c2b16] text-amber-200 shadow">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-amber-800 font-medium">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-600" />
              <span>{isVi ? 'Pháp Hỷ đang chiêm nghiệm câu trả lời...' : 'Phap Hy is contemplating...'}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        {suggestions.length > 0 && (
          <div className="px-4 py-2 border-t border-amber-200/60 bg-amber-50/50 flex gap-1.5 overflow-x-auto no-scrollbar">
            {suggestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="whitespace-nowrap rounded-xl bg-white px-3 py-1 text-[11px] font-medium text-[#5c2b16] border border-amber-300 shadow-xs hover:bg-amber-100 transition-all shrink-0"
              >
                ✨ {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 border-t border-amber-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isVi ? 'Hỏi Pháp Hỷ về di tích, lịch sử, tượng Phật...' : 'Ask about relics, architecture...'}
              className="flex-1 rounded-2xl bg-stone-100 px-4 py-2.5 text-xs text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 border border-stone-200"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-stone-950 shadow hover:brightness-110 disabled:opacity-50 transition-all"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
