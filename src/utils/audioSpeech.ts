/**
 * Sacred Buddhist Audio & Speech Synthesis Engine
 * Mobile-Hardened for iOS Safari (Apple WebKit) and Android Chrome (Blink)
 *
 * Implements:
 * 1. Rolling Cascade Chunking: Strictly <= 90 characters per chunk (well below 100 chars)
 *    to eliminate iOS word spelling, unnatural phonetic breaks, and the 15-second cutoff bug.
 * 2. Distortion Shield for Apple:
 *    - Detects iOS / iPadOS / macOS and automatically picks Apple's native Vietnamese voices
 *      ("Linh", "Mai", "Enhanced", "Premium") without searching for "Google" / "Microsoft".
 *    - Forces fixed pitch = 1.0 and safe rate in [0.95 - 1.05] (nominal 1.0) to completely
 *      prevent robotic / chipmunk / vỡ giọng distortion.
 * 3. Instant UI Synchronization:
 *    - Emits state updates on every start, pause, resume, progress tick, chunk transition, and seek.
 * 4. Queue Unstuck Loop:
 *    - Clears hung OS speech synthesis daemons using dummy utterances and hardware unlockers.
 */

export const templeSFX = {
  playTempleBell: (_frequency: number = 260) => {},
};

export type LanguageCode =
  | 'vi'
  | 'en'
  | 'zh'
  | 'ja'
  | 'ko'
  | 'fr'
  | 'de'
  | 'es'
  | 'ru'
  | 'th'
  | 'id'
  | 'it';

export type VoiceEngineId = 'chi-google' | 'google-cloud' | 'bing' | 'tiktok' | 'browser';

export interface VoiceEngineOption {
  id: VoiceEngineId;
  name: string;
  provider: string;
  description: string;
  defaultRate: number;
  defaultPitch: number;
}

export const VOICE_ENGINES: VoiceEngineOption[] = [
  {
    id: 'chi-google',
    name: 'Chị Google / Apple Linh',
    provider: 'Google VN & Apple Native',
    description: 'Giọng đọc chuẩn tiếng Việt, phát âm tự nhiên, trang nghiêm trên mọi thiết bị.',
    defaultRate: 1.0,
    defaultPitch: 1.0,
  },
  {
    id: 'google-cloud',
    name: 'Google Cloud / AI Neural',
    provider: 'AI Neural TTS Engine',
    description: 'Ngữ điệu thông minh chuẩn AI Cloud, phong thái điềm tĩnh, thanh tịnh.',
    defaultRate: 1.0,
    defaultPitch: 1.0,
  },
  {
    id: 'bing',
    name: 'Microsoft Hoài My / Bing',
    provider: 'Microsoft Natural Edge',
    description: 'Giọng đọc mượt mà phong cách Hoài My / Nam Minh, ấm áp và rõ ràng.',
    defaultRate: 0.98,
    defaultPitch: 1.0,
  },
  {
    id: 'tiktok',
    name: 'Giọng Thuyết Minh Truyền Cảm',
    provider: 'Apple Mai / Siri / Narration',
    description: 'Giọng đọc thanh thoát, lôi cuốn, ngắt nghỉ câu chữ linh hoạt.',
    defaultRate: 1.02,
    defaultPitch: 1.0,
  },
  {
    id: 'browser',
    name: 'Giọng Thiết Bị Bản Địa',
    provider: 'Hệ điều hành thiết bị',
    description: 'Sử dụng trực tiếp giọng đọc mặc định tích hợp trên hệ điều hành máy.',
    defaultRate: 1.0,
    defaultPitch: 1.0,
  },
];

const LANG_VOICE_MAP: Record<LanguageCode, string[]> = {
  vi: ['vi-VN', 'vi', 'vietnam'],
  en: ['en-US', 'en-GB', 'en-AU', 'en'],
  zh: ['zh-CN', 'zh-TW', 'zh-HK', 'zh'],
  ja: ['ja-JP', 'ja'],
  ko: ['ko-KR', 'ko'],
  fr: ['fr-FR', 'fr-CA', 'fr'],
  de: ['de-DE', 'de'],
  es: ['es-ES', 'es-MX', 'es'],
  ru: ['ru-RU', 'ru'],
  th: ['th-TH', 'th'],
  id: ['id-ID', 'id'],
  it: ['it-IT', 'it'],
};

export interface AudioEngineState {
  isSpeaking: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  duration: number;
  currentTitle: string;
  currentPoiId?: string;
  selectedEngine: VoiceEngineId;
  rate: number;
  pitch: number;
  currentChunkIndex?: number;
  totalChunks?: number;
}

/**
 * Intelligent sub-clause splitting for iOS Safari & Android mobile Web Speech API.
 * Strict upper limit: 88 characters (guaranteed < 100 characters).
 * Breaks sentences at natural punctuation marks (. ! ? ; , - : \n).
 * Resolves the iOS letter spelling bug and the 15-second speech buffer timeout.
 */
export function splitTextIntoSentences(text: string, maxLen: number = 88): string[] {
  if (!text || !text.trim()) return [];

  // Normalize punctuation and line breaks
  const normalized = text
    .replace(/\.{3,}/g, '. ')
    .replace(/…/g, '. ')
    .replace(/\r\n|\r|\n/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();

  // Primary split on sentence boundaries
  const rawSentences =
    normalized.match(/[^.!?;\u3002\uFF01\uFF1F\uFF1B]+[.!?;\u3002\uFF01\uFF1F\uFF1B]*|[^.!?;\u3002\uFF01\uFF1F\uFF1B]+$/g) || [normalized];
  const chunks: string[] = [];

  for (const raw of rawSentences) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    if (trimmed.length <= maxLen) {
      chunks.push(trimmed);
    } else {
      // Secondary split on commas, colons, dashes, parentheses
      const subParts =
        trimmed.match(/[^,:\-–—\(\)\uFF0C\uFF1A]+[,:\-–—\(\)\uFF0C\uFF1A]*|[^,:\-–—\(\)\uFF0C\uFF1A]+$/g) || [trimmed];
      let currentBuffer = '';

      for (const part of subParts) {
        const p = part.trim();
        if (!p) continue;

        if ((currentBuffer + ' ' + p).trim().length <= maxLen) {
          currentBuffer = (currentBuffer ? currentBuffer + ' ' : '') + p;
        } else {
          if (currentBuffer) {
            chunks.push(currentBuffer.trim());
          }
          if (p.length <= maxLen) {
            currentBuffer = p;
          } else {
            // Tertiary split: break along words
            const words = p.split(' ');
            let wordBuffer = '';
            for (const w of words) {
              if ((wordBuffer + ' ' + w).trim().length <= maxLen) {
                wordBuffer = (wordBuffer ? wordBuffer + ' ' : '') + w;
              } else {
                if (wordBuffer) chunks.push(wordBuffer.trim());
                wordBuffer = w;
              }
            }
            currentBuffer = wordBuffer;
          }
        }
      }

      if (currentBuffer && currentBuffer.trim()) {
        chunks.push(currentBuffer.trim());
      }
    }
  }

  // Filter out empty or punctuation-only chunks
  return chunks
    .map((c) => c.trim())
    .filter((c) => c.length > 0 && /[a-zA-Z0-9\u00C0-\u1EF9]/i.test(c));
}

/**
 * Checks if client is running on iOS / iPadOS / macOS
 */
export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isMac =
    /Macintosh|MacIntel|MacPPC/i.test(platform) || (/Mac/i.test(ua) && (navigator.maxTouchPoints || 0) > 1);
  return isIOS || isMac;
}

export class AudioSpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private isPaused: boolean = false;
  private isSpeaking: boolean = false;

  private selectedEngine: VoiceEngineId = 'chi-google';
  private speechRate: number = 1.0;
  private speechPitch: number = 1.0;
  private selectedVoiceURI: string | null = null;

  private progressTimer: any = null;
  private chunkWatchdogTimer: any = null;

  // Chunking cascade state
  private textChunks: string[] = [];
  private currentChunkIndex: number = 0;
  private sessionToken: number = 0;

  private currentText: string = '';
  private currentLang: LanguageCode = 'vi';
  private currentTitle: string = '';
  private currentPoiId?: string;
  private estimatedDuration: number = 45;
  private elapsedSeconds: number = 0;

  private isAutoplayPrimed: boolean = false;
  private onStateChangeCallback?: (state: AudioEngineState) => void;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadSavedSettings();
      this.setupGlobalAutoplayListener();

      if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = () => {
          this.getAvailableSystemVoices();
        };
      }

      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.isSpeaking && !this.isPaused && this.synth) {
          if (this.synth.paused) {
            try {
              this.synth.resume();
            } catch {}
          }
        }
      });
    }
  }

  private setupGlobalAutoplayListener() {
    if (typeof window === 'undefined') return;

    const onUserInteraction = () => {
      this.primeAutoplay();
      window.removeEventListener('click', onUserInteraction, { capture: true });
      window.removeEventListener('touchstart', onUserInteraction, { capture: true });
      window.removeEventListener('pointerdown', onUserInteraction, { capture: true });
    };

    window.addEventListener('click', onUserInteraction, { capture: true, passive: true });
    window.addEventListener('touchstart', onUserInteraction, { capture: true, passive: true });
    window.addEventListener('pointerdown', onUserInteraction, { capture: true, passive: true });
  }

  public primeAutoplay(): boolean {
    if (this.isAutoplayPrimed || !this.synth) return true;

    try {
      if (this.synth.paused) {
        this.synth.resume();
      }

      const silentUtterance = new SpeechSynthesisUtterance(' ');
      silentUtterance.volume = 0.001;
      silentUtterance.rate = 2.0;
      silentUtterance.pitch = 1.0;
      silentUtterance.lang = 'vi-VN';
      this.synth.speak(silentUtterance);

      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
          }
          const buf = ctx.createBuffer(1, 1, 22050);
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.connect(ctx.destination);
          src.start(0);
        }
      } catch {}

      this.isAutoplayPrimed = true;
      return true;
    } catch (err) {
      console.warn('[AudioSpeechEngine] primeAutoplay notice:', err);
      return false;
    }
  }

  public forceResetSynthesisQueue() {
    if (!this.synth) return;

    try {
      if (this.chunkWatchdogTimer) {
        clearTimeout(this.chunkWatchdogTimer);
        this.chunkWatchdogTimer = null;
      }

      if (this.synth.paused) {
        this.synth.resume();
      }
      this.synth.cancel();

      if (this.synth.speaking || this.synth.pending) {
        const unstuckDummy = new SpeechSynthesisUtterance('');
        unstuckDummy.volume = 0;
        unstuckDummy.rate = 2.0;
        unstuckDummy.lang = 'vi-VN';
        this.synth.speak(unstuckDummy);
        this.synth.cancel();
      }
    } catch (err) {
      console.warn('[AudioSpeechEngine] forceResetSynthesisQueue error:', err);
    }
  }

  private loadSavedSettings() {
    try {
      const savedEngine = localStorage.getItem('vnqt_voice_engine') as VoiceEngineId | null;
      const savedRate = localStorage.getItem('vnqt_speech_rate');
      const savedPitch = localStorage.getItem('vnqt_speech_pitch');
      const savedURI = localStorage.getItem('vnqt_voice_uri');

      if (savedEngine && VOICE_ENGINES.some((e) => e.id === savedEngine)) {
        this.selectedEngine = savedEngine;
      }
      if (savedRate) {
        const parsedRate = parseFloat(savedRate);
        if (!isNaN(parsedRate)) this.speechRate = Math.max(0.7, Math.min(1.4, parsedRate));
      }
      if (savedPitch) {
        const parsedPitch = parseFloat(savedPitch);
        if (!isNaN(parsedPitch)) this.speechPitch = Math.max(0.8, Math.min(1.3, parsedPitch));
      }
      if (savedURI) {
        this.selectedVoiceURI = savedURI;
      }
    } catch {}
  }

  public syncDefaultFromAdmin(defaultSettings: { voiceEngine?: string; rate?: number; pitch?: number }) {
    try {
      const hasUserCustomized = localStorage.getItem('vnqt_voice_user_customized');
      if (!hasUserCustomized && defaultSettings) {
        if (defaultSettings.voiceEngine && VOICE_ENGINES.some((e) => e.id === defaultSettings.voiceEngine)) {
          this.selectedEngine = defaultSettings.voiceEngine as VoiceEngineId;
        }
        if (typeof defaultSettings.rate === 'number') {
          this.speechRate = Math.max(0.7, Math.min(1.4, defaultSettings.rate));
        }
        if (typeof defaultSettings.pitch === 'number') {
          this.speechPitch = Math.max(0.8, Math.min(1.3, defaultSettings.pitch));
        }
        this.notify();
      }
    } catch {}
  }

  public setOnStateChange(callback: (state: AudioEngineState) => void) {
    this.onStateChangeCallback = callback;
  }

  public onStateChange(callback: (state: AudioEngineState) => void) {
    this.setOnStateChange(callback);
  }

  private notify() {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({
        isSpeaking: this.isSpeaking,
        isPaused: this.isPaused,
        elapsedSeconds: this.elapsedSeconds,
        duration: this.estimatedDuration,
        currentTitle: this.currentTitle,
        currentPoiId: this.currentPoiId,
        selectedEngine: this.selectedEngine,
        rate: this.speechRate,
        pitch: this.speechPitch,
        currentChunkIndex: this.currentChunkIndex,
        totalChunks: this.textChunks.length,
      });
    }
  }

  public getAvailableSystemVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  public getAvailableVoicesForLanguage(lang: LanguageCode): SpeechSynthesisVoice[] {
    const all = this.getAvailableSystemVoices();
    const tags = LANG_VOICE_MAP[lang] || ['vi'];
    return all.filter((v) => tags.some((t) => v.lang.toLowerCase().replace('_', '-').includes(t.toLowerCase())));
  }

  public getEngine(): VoiceEngineId {
    return this.selectedEngine;
  }

  public getRate(): number {
    return this.speechRate;
  }

  public getPitch(): number {
    return this.speechPitch;
  }

  public setEngine(engineId: VoiceEngineId, markUserCustom: boolean = true) {
    const engine = VOICE_ENGINES.find((e) => e.id === engineId);
    if (engine) {
      this.selectedEngine = engine.id;
      this.speechRate = engine.defaultRate;
      this.speechPitch = engine.defaultPitch;

      try {
        localStorage.setItem('vnqt_voice_engine', engine.id);
        localStorage.setItem('vnqt_speech_rate', String(this.speechRate));
        localStorage.setItem('vnqt_speech_pitch', String(this.speechPitch));
        if (markUserCustom) {
          localStorage.setItem('vnqt_voice_user_customized', 'true');
        }
      } catch {}

      if (this.isSpeaking && !this.currentAudioElement) {
        this.seekTo(this.elapsedSeconds);
      } else {
        this.notify();
      }
    }
  }

  public setRate(rate: number, markUserCustom: boolean = true) {
    this.speechRate = Math.max(0.7, Math.min(1.4, Math.round(rate * 100) / 100));
    try {
      localStorage.setItem('vnqt_speech_rate', String(this.speechRate));
      if (markUserCustom) localStorage.setItem('vnqt_voice_user_customized', 'true');
    } catch {}
    if (this.isSpeaking && !this.currentAudioElement) {
      this.seekTo(this.elapsedSeconds);
    } else {
      this.notify();
    }
  }

  public setPitch(pitch: number, markUserCustom: boolean = true) {
    this.speechPitch = Math.max(0.8, Math.min(1.3, Math.round(pitch * 100) / 100));
    try {
      localStorage.setItem('vnqt_speech_pitch', String(this.speechPitch));
      if (markUserCustom) localStorage.setItem('vnqt_voice_user_customized', 'true');
    } catch {}
    if (this.isSpeaking && !this.currentAudioElement) {
      this.seekTo(this.elapsedSeconds);
    } else {
      this.notify();
    }
  }

  public setSystemVoiceURI(voiceURI: string | null) {
    this.selectedVoiceURI = voiceURI;
    try {
      if (voiceURI) localStorage.setItem('vnqt_voice_uri', voiceURI);
      else localStorage.removeItem('vnqt_voice_uri');
      localStorage.setItem('vnqt_voice_user_customized', 'true');
    } catch {}
    this.notify();
  }

  /**
   * Mobile Voice Matcher with Apple Priority:
   * On iOS / iPadOS / macOS, bypasses "Google" search and directly picks Apple's native
   * Vietnamese voices ("Linh" / "Mai" / "Enhanced" / "Premium").
   */
  public pickVoiceForEngine(engineId: VoiceEngineId, lang: LanguageCode): SpeechSynthesisVoice | undefined {
    if (!this.synth) return undefined;
    const voices = this.synth.getVoices();
    if (voices.length === 0) return undefined;

    const preferredTags = LANG_VOICE_MAP[lang] || ['vi-VN', 'vi'];
    const langVoices = voices.filter((v) => {
      const vLang = v.lang.toLowerCase().replace('_', '-');
      return preferredTags.some((tag) => vLang.startsWith(tag.toLowerCase()) || vLang.includes(tag.toLowerCase()));
    });

    // 1. If explicit user-selected voice matches target language
    if (this.selectedVoiceURI && langVoices.length > 0) {
      const explicitVoice = langVoices.find((v) => v.voiceURI === this.selectedVoiceURI);
      if (explicitVoice) return explicitVoice;
    }

    if (langVoices.length === 0) {
      return undefined;
    }

    const isApple = isApplePlatform();
    const isEnhancedOrPremium = (v: SpeechSynthesisVoice) =>
      /enhanced|premium|natural|neural|high quality/i.test(v.name);
    const isAppleVoice = (v: SpeechSynthesisVoice) =>
      /apple|linh|mai|siri/i.test(v.name) || /com\.apple\./i.test(v.voiceURI);

    if (lang === 'vi') {
      // RULE: If running on Apple device, ONLY pick Apple native voices
      if (isApple) {
        // Priority 1: Apple Linh (Enhanced / Premium)
        const linhEnhanced = langVoices.find(
          (v) => (/linh/i.test(v.name) || /linh/i.test(v.voiceURI)) && isEnhancedOrPremium(v)
        );
        if (linhEnhanced) return linhEnhanced;

        // Priority 2: Apple Linh Standard
        const linh = langVoices.find((v) => /linh/i.test(v.name) || /linh/i.test(v.voiceURI));
        if (linh) return linh;

        // Priority 3: Apple Mai (Enhanced / Premium)
        const maiEnhanced = langVoices.find(
          (v) => (/mai/i.test(v.name) || /mai/i.test(v.voiceURI)) && isEnhancedOrPremium(v)
        );
        if (maiEnhanced) return maiEnhanced;

        // Priority 4: Apple Mai Standard
        const mai = langVoices.find((v) => /mai/i.test(v.name) || /mai/i.test(v.voiceURI));
        if (mai) return mai;

        // Priority 5: Any Apple voice
        const anyApple = langVoices.find(isAppleVoice);
        if (anyApple) return anyApple;

        return langVoices[0];
      }

      // Android / Chrome / Windows environment
      if (engineId === 'chi-google' || engineId === 'google-cloud') {
        const googleVoice = langVoices.find((v) => /google|vic-network|vif-network|gft-local|neural/i.test(v.name));
        if (googleVoice) return googleVoice;

        const enhanced = langVoices.find(isEnhancedOrPremium);
        if (enhanced) return enhanced;
      } else if (engineId === 'bing') {
        const msVoice = langVoices.find((v) => /microsoft|edge|bing|hoaimy|namminh|online.*natural/i.test(v.name));
        if (msVoice) return msVoice;

        const enhanced = langVoices.find(isEnhancedOrPremium);
        if (enhanced) return enhanced;
      } else if (engineId === 'tiktok') {
        const upbeat = langVoices.find((v) => /mai|siri|female|vif-network/i.test(v.name));
        if (upbeat) return upbeat;
      }

      const fallbackEnhanced = langVoices.find(isEnhancedOrPremium);
      if (fallbackEnhanced) return fallbackEnhanced;

      return langVoices[0];
    } else {
      // Non-Vietnamese languages
      if (engineId === 'chi-google' || engineId === 'google-cloud') {
        const google = langVoices.find((v) => /google|neural|cloud/i.test(v.name));
        if (google) return google;
      } else if (engineId === 'bing') {
        const ms = langVoices.find((v) => /microsoft|natural|online/i.test(v.name));
        if (ms) return ms;
      }

      const enhanced = langVoices.find(isEnhancedOrPremium);
      if (enhanced) return enhanced;

      const defaultVoice = langVoices.find((v) => v.default);
      if (defaultVoice) return defaultVoice;

      return langVoices[0];
    }
  }

  public playNarration(
    text: string,
    lang: LanguageCode = 'vi',
    poiTitle?: string,
    _playChime: boolean = false,
    poiId?: string,
    audioUrl?: string,
    introText?: string
  ) {
    this.stopPlaybackInternal();

    const speechSegments: string[] = [];
    if (poiTitle && poiTitle.trim()) {
      speechSegments.push(poiTitle.trim());
    }
    if (introText && introText.trim() && !text.includes(introText.trim())) {
      speechSegments.push(introText.trim());
    }
    if (text && text.trim()) {
      speechSegments.push(text.trim());
    }
    const fullTextToRead = speechSegments.length > 0 ? speechSegments.join('. ') : text || '';

    this.currentText = fullTextToRead;
    this.currentLang = lang;
    this.currentTitle = poiTitle || '';
    this.currentPoiId = poiId;
    this.elapsedSeconds = 0;

    const isDedicatedAudioUrl =
      audioUrl &&
      audioUrl.trim() !== '' &&
      !audioUrl.includes('/api/audio/bell') &&
      !audioUrl.startsWith('data:audio') &&
      /\.(mp3|m4a|aac)(\?.*)?$/i.test(audioUrl);

    if (isDedicatedAudioUrl) {
      try {
        const audio = new Audio(audioUrl);
        this.currentAudioElement = audio;
        audio.onloadedmetadata = () => {
          this.estimatedDuration = Math.round(audio.duration || 45);
          this.notify();
        };
        audio.ontimeupdate = () => {
          this.elapsedSeconds = Math.round(audio.currentTime);
          this.notify();
        };
        audio.onended = () => {
          this.cleanup();
          this.notify();
        };
        audio.onerror = () => {
          this.currentAudioElement = null;
          this.startChunkedSpeech(fullTextToRead, lang, 0);
        };
        audio.play().then(() => {
          this.isSpeaking = true;
          this.isPaused = false;
          this.notify();
        }).catch(() => {
          this.currentAudioElement = null;
          this.startChunkedSpeech(fullTextToRead, lang, 0);
        });
        return;
      } catch (e) {
        console.warn('Native audio element notice:', e);
      }
    }

    // Web Speech Synthesis
    const words = fullTextToRead.trim().split(/\s+/).filter(Boolean).length;
    this.estimatedDuration = Math.max(12, Math.round((words / (120 * (this.speechRate || 1.0))) * 60));

    this.startChunkedSpeech(fullTextToRead, lang, 0);
  }

  public speak(
    text: string,
    title?: string,
    lang: LanguageCode = 'vi',
    poiId?: string,
    audioUrl?: string,
    introText?: string
  ) {
    this.playNarration(text, lang, title, false, poiId, audioUrl, introText);
  }

  private startChunkedSpeech(fullText: string, lang: LanguageCode, startElapsed: number = 0) {
    if (!this.synth) {
      console.warn('SpeechSynthesis is not supported on this browser.');
      return;
    }

    this.primeAutoplay();

    // Strict sub-clause chunking: <= 88 characters (well under 100)
    this.textChunks = splitTextIntoSentences(fullText, 88);
    this.currentChunkIndex = 0;
    this.sessionToken++;
    const currentSession = this.sessionToken;

    this.elapsedSeconds = startElapsed;
    this.isSpeaking = true;
    this.isPaused = false;
    this.notify();
    this.startTimer();

    this.playNextChunk(currentSession);
  }

  private playNextChunk(expectedSession: number) {
    if (this.sessionToken !== expectedSession || !this.synth) {
      return;
    }

    if (this.currentChunkIndex >= this.textChunks.length) {
      this.cleanup();
      this.notify();
      return;
    }

    const chunkText = this.textChunks[this.currentChunkIndex];
    if (!chunkText || !chunkText.trim()) {
      this.currentChunkIndex++;
      this.playNextChunk(expectedSession);
      return;
    }

    if (this.chunkWatchdogTimer) {
      clearTimeout(this.chunkWatchdogTimer);
      this.chunkWatchdogTimer = null;
    }

    try {
      if (this.synth.paused) {
        this.synth.resume();
      }
      this.synth.cancel();
    } catch {}

    const utterance = new SpeechSynthesisUtterance(chunkText);
    this.currentUtterance = utterance;

    const chosenVoice = this.pickVoiceForEngine(this.selectedEngine, this.currentLang);
    const defaultLangTag = LANG_VOICE_MAP[this.currentLang]?.[0] || 'vi-VN';

    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang;
    } else {
      utterance.lang = defaultLangTag;
    }

    // DISTORTION SHIELD FOR APPLE (iOS/iPadOS/macOS):
    // Force pitch = 1.0 and clamp rate to [0.95 - 1.05] (nominal 1.0)
    const isApple =
      isApplePlatform() || (chosenVoice && /apple|linh|mai|siri/i.test(chosenVoice.name + ' ' + chosenVoice.voiceURI));
    const safePitch = isApple ? 1.0 : Math.max(0.85, Math.min(1.25, this.speechPitch));
    const safeRate = isApple
      ? Math.max(0.95, Math.min(1.05, this.speechRate || 1.0))
      : Math.max(0.8, Math.min(1.3, this.speechRate || 1.0));

    utterance.rate = safeRate;
    utterance.pitch = safePitch;

    utterance.onstart = () => {
      if (this.sessionToken !== expectedSession) return;
      this.isSpeaking = true;
      this.isPaused = false;
      this.notify();
    };

    utterance.onend = () => {
      if (this.sessionToken !== expectedSession) return;
      if (this.chunkWatchdogTimer) {
        clearTimeout(this.chunkWatchdogTimer);
        this.chunkWatchdogTimer = null;
      }

      this.currentChunkIndex++;

      // Recalculate progress time accurately on chunk completion
      if (this.textChunks.length > 0) {
        const ratio = this.currentChunkIndex / this.textChunks.length;
        this.elapsedSeconds = Math.min(this.estimatedDuration, Math.round(ratio * this.estimatedDuration));
      }
      this.notify();

      setTimeout(() => {
        this.playNextChunk(expectedSession);
      }, 35);
    };

    utterance.onerror = (e) => {
      if (this.sessionToken !== expectedSession) return;
      if ((e as any).error === 'canceled' || (e as any).error === 'interrupted') {
        return;
      }

      console.warn(`[Speech Chunk ${this.currentChunkIndex} Notice]:`, (e as any).error);
      if (this.chunkWatchdogTimer) {
        clearTimeout(this.chunkWatchdogTimer);
        this.chunkWatchdogTimer = null;
      }

      this.currentChunkIndex++;
      this.notify();

      setTimeout(() => {
        this.playNextChunk(expectedSession);
      }, 45);
    };

    const wordsInChunk = chunkText.split(/\s+/).length;
    const expectedDurationMs = Math.max(3500, (wordsInChunk / 2.0) * (1 / safeRate) * 1000);
    this.chunkWatchdogTimer = setTimeout(() => {
      if (this.sessionToken === expectedSession && this.isSpeaking && !this.isPaused) {
        console.warn('[AudioSpeechEngine] Chunk watchdog auto-advancing.');
        this.forceResetSynthesisQueue();
        this.currentChunkIndex++;
        this.notify();
        this.playNextChunk(expectedSession);
      }
    }, expectedDurationMs + 3000);

    try {
      this.synth.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis speak failed:', err);
      this.currentChunkIndex++;
      this.notify();
      this.playNextChunk(expectedSession);
    }
  }

  public seekTo(targetSeconds: number) {
    const clamped = Math.max(0, Math.min(this.estimatedDuration, Math.round(targetSeconds)));
    this.elapsedSeconds = clamped;

    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.currentTime = clamped;
      } catch {}
      this.notify();
      return;
    }

    if (!this.synth || !this.currentText) {
      this.notify();
      return;
    }

    if (clamped >= this.estimatedDuration) {
      this.stop();
      return;
    }

    const ratio = this.estimatedDuration > 0 ? clamped / this.estimatedDuration : 0;
    const targetChunk = Math.min(
      Math.max(0, this.textChunks.length - 1),
      Math.floor(ratio * this.textChunks.length)
    );

    this.stopPlaybackInternal();
    this.sessionToken++;
    const currentSession = this.sessionToken;

    this.currentChunkIndex = targetChunk;
    this.isSpeaking = true;
    this.isPaused = false;
    this.notify();
    this.startTimer();

    this.playNextChunk(currentSession);
  }

  public rewind(seconds: number = 10) {
    this.seekTo(Math.max(0, this.elapsedSeconds - seconds));
  }

  public forward(seconds: number = 10) {
    this.seekTo(Math.min(this.estimatedDuration, this.elapsedSeconds + seconds));
  }

  public pause() {
    if (this.currentAudioElement && !this.currentAudioElement.paused) {
      this.currentAudioElement.pause();
      this.isPaused = true;
      this.notify();
      return;
    }

    if (this.synth && this.isSpeaking && !this.isPaused) {
      try {
        this.synth.pause();
      } catch {}
      this.isPaused = true;
      this.stopTimer();
      if (this.chunkWatchdogTimer) {
        clearTimeout(this.chunkWatchdogTimer);
        this.chunkWatchdogTimer = null;
      }
      this.notify();
    }
  }

  public resume() {
    if (this.currentAudioElement && this.currentAudioElement.paused) {
      this.currentAudioElement.play().catch(() => {});
      this.isPaused = false;
      this.notify();
      return;
    }

    if (this.synth && this.isSpeaking && this.isPaused) {
      try {
        this.synth.resume();
      } catch {}
      this.isPaused = false;
      this.startTimer();
      this.notify();

      setTimeout(() => {
        if (this.isSpeaking && !this.synth?.speaking) {
          const currentSession = ++this.sessionToken;
          this.playNextChunk(currentSession);
        }
      }, 300);
    }
  }

  public stop() {
    this.stopPlaybackInternal();
    this.cleanup();
    this.notify();
  }

  private stopPlaybackInternal() {
    this.sessionToken++;

    if (this.chunkWatchdogTimer) {
      clearTimeout(this.chunkWatchdogTimer);
      this.chunkWatchdogTimer = null;
    }

    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
        this.currentAudioElement = null;
      } catch {}
    }

    this.forceResetSynthesisQueue();
  }

  public testVoice(sampleText?: string, lang: LanguageCode = 'vi') {
    const textByLang: Record<LanguageCode, string> = {
      vi: 'Nam Mô A Di Đà Phật. Bạn đang nghe thử giọng đọc thuyết minh tại Việt Nam Quốc Tự.',
      en: 'Welcome to Vietnam Quoc Tu Pagoda. You are listening to the automatic audio narration.',
      zh: '南无阿弥陀佛。欢迎来到越南国寺，您正在收听多语言自动语音导览。',
      ja: '南無阿弥陀仏。ベトナム国寺へようこそ。音声ガイドをテストしています。',
      ko: '나무아미타불. 베트남 국사에 오신 것을 환영합니다. 오디오 가이드를 테스트하고 있습니다.',
      fr: 'Bienvenue à la pagode Vietnam Quoc Tu. Vous écoutez le guide audio automatique.',
      de: 'Willkommen in der Vietnam Quoc Tu Pagode. Sie hören die automatische Audioführung.',
      es: 'Bienvenido a la Pagoda Vietnam Quoc Tu. Está escuchando la audioguía automática.',
      ru: 'Добро пожаловать в пагоду Вьетнам Куок Ты. Вы слушаете аудиогид.',
      th: 'ยินดีต้อนรับสู่วัดเวียดนามกว๊อกตื่อ ท่านกำลังฟังระบบบรรยายเสียงอัตโนมัติ',
      id: 'Selamat datang di Wihara Vietnam Quoc Tu. Anda sedang mendengarkan panduan audio otomatis.',
      it: 'Benvenuti alla Pagoda Vietnam Quoc Tu. State ascoltando l audioguida automatica.',
    };
    const text = sampleText || textByLang[lang] || textByLang['vi'];
    this.playNarration(text, lang, 'Thử giọng đọc', false);
  }

  private startTimer() {
    this.stopTimer();
    this.progressTimer = setInterval(() => {
      if (!this.isPaused && this.isSpeaking) {
        this.elapsedSeconds = Math.min(this.estimatedDuration, this.elapsedSeconds + 1);
        this.notify();
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  private cleanup() {
    this.stopTimer();
    if (this.chunkWatchdogTimer) {
      clearTimeout(this.chunkWatchdogTimer);
      this.chunkWatchdogTimer = null;
    }
    this.isSpeaking = false;
    this.isPaused = false;
    this.elapsedSeconds = 0;
    this.currentUtterance = null;
    this.textChunks = [];
    this.currentChunkIndex = 0;
  }
}

export const speechEngine = new AudioSpeechEngine();
export const audioSpeechEngine = speechEngine;
