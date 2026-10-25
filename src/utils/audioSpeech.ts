/**
 * Sacred Buddhist Audio & Speech Synthesis Engine
 * Ultra-Resilient Monolith Audio Architecture for Mobile (iOS Safari, Android Chrome, In-App Browsers)
 *
 * Implements 4 Core Engineering Safeguards:
 * 1. Rolling Cascade Chunking: Splits long narration into natural sub-clauses (<= 120 chars)
 *    and chains them sequentially via `utterance.onend`. Completely eliminates mobile 15-second
 *    buffer overflow and silent cutoff bugs.
 * 2. Mobile Voice Matcher & Distortion Shield:
 *    - iOS/iPadOS/macOS: Prioritizes Apple's native Vietnamese voices ("Linh", "Mai", "Enhanced", "Premium").
 *    - Android/Windows: Prioritizes "Google Tiếng Việt", "Neural", and "Microsoft Natural".
 *    - Distortion Shield: Enforces strict safety clamps on iOS (Pitch: [0.96 - 1.04], Rate: [0.90 - 1.10])
 *      to completely prevent robotic, high-pitched, or vỡ giọng distortions.
 * 3. Asynchronous Queue Stuck Reset: Employs a hardware reset loop (Queue Unstuck Loop) with silent
 *    dummy utterances to force OS audio daemons (e.g. `com.apple.speech.speechsynthesisd`) to release
 *    hung asynchronous locks.
 * 4. Autoplay Primer & Hardware Unlocker (`primeAutoplay`): Pre-authorizes the device's Audio Hardware
 *    Session on the first user gesture (touch/click), enabling background GPS geofence triggers to play.
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
    description: 'Giọng đọc chuẩn tiếng Việt, phát âm tự nhiên và truyền cảm trên mọi thiết bị.',
    defaultRate: 0.98,
    defaultPitch: 1.0,
  },
  {
    id: 'google-cloud',
    name: 'Google Cloud / AI Neural',
    provider: 'AI Neural TTS Engine',
    description: 'Ngữ điệu thông minh chuẩn AI Cloud, phong thái điềm tĩnh, thanh tịnh.',
    defaultRate: 0.98,
    defaultPitch: 1.0,
  },
  {
    id: 'bing',
    name: 'Microsoft Hoài My / Bing',
    provider: 'Microsoft Natural Edge',
    description: 'Giọng đọc mượt mà phong cách Hoài My / Nam Minh, ấm áp và rõ ràng.',
    defaultRate: 0.96,
    defaultPitch: 0.98,
  },
  {
    id: 'tiktok',
    name: 'Giọng Thuyết Minh Truyền Cảm',
    provider: 'Apple Mai / Siri / Narration',
    description: 'Giọng đọc thanh thoát, lôi cuốn, nhấn nhá câu chữ linh hoạt.',
    defaultRate: 1.02,
    defaultPitch: 1.02,
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
 * Intelligent sentence chunking for mobile speech synthesis.
 * Breaks text into natural spoken sub-clauses (strictly <= 120 chars) around punctuation marks (. ! ? ; , - \n).
 * Completely eliminates the mobile WebKit 15-second speech buffer overflow bug.
 */
export function splitTextIntoSentences(text: string, maxLen: number = 120): string[] {
  if (!text || !text.trim()) return [];

  // Normalize whitespace and line breaks
  const normalized = text
    .replace(/\r\n|\r|\n/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();

  // Primary split by sentence boundaries (. ! ? ; or full-width equivalents)
  const primarySentences =
    normalized.match(/[^.!?;\u3002\uFF01\uFF1F\uFF1B]+[.!?;\u3002\uFF01\uFF1F\uFF1B]*|[^.!?;\u3002\uFF01\uFF1F\uFF1B]+$/g) || [normalized];

  const chunks: string[] = [];

  for (const sentence of primarySentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if (trimmed.length <= maxLen) {
      chunks.push(trimmed);
    } else {
      // Secondary split by clauses (commas, colons, dashes)
      const subClauses =
        trimmed.match(/[^,:\uFF0C\uFF1A\-]+[,:\uFF0C\uFF1A\-]*|[^,:\uFF0C\uFF1A\-]+$/g) || [trimmed];
      let currentBuffer = '';

      for (const clause of subClauses) {
        const c = clause.trim();
        if (!c) continue;

        if ((currentBuffer + ' ' + c).trim().length <= maxLen) {
          currentBuffer = (currentBuffer ? currentBuffer + ' ' : '') + c;
        } else {
          if (currentBuffer) {
            chunks.push(currentBuffer.trim());
          }
          if (c.length <= maxLen) {
            currentBuffer = c;
          } else {
            // Tertiary split: break along words
            const words = c.split(' ');
            let wordBuffer = '';
            for (const word of words) {
              if ((wordBuffer + ' ' + word).trim().length <= maxLen) {
                wordBuffer = (wordBuffer ? wordBuffer + ' ' : '') + word;
              } else {
                if (wordBuffer) chunks.push(wordBuffer.trim());
                wordBuffer = word;
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

  return chunks.length > 0 ? chunks : [normalized];
}

/**
 * Detects whether the client is running on an Apple OS (iOS / iPadOS / macOS)
 */
export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isMac = /Macintosh|MacIntel|MacPPC|Mac68K/i.test(platform) || (/Mac/i.test(ua) && (navigator.maxTouchPoints || 0) > 1);
  return isIOS || isMac;
}

export class AudioSpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private isPaused: boolean = false;
  private isSpeaking: boolean = false;

  private selectedEngine: VoiceEngineId = 'chi-google';
  private speechRate: number = 0.98;
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

      // Listen for dynamic voice list availability
      if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = () => {
          this.getAvailableSystemVoices();
        };
      }

      // Handle visibility changes cleanly
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

  /**
   * One-time global user gesture listener to prime mobile autoplay automatically
   */
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

  /**
   * Public Autoplay Primer & Hardware Unlocker (Requirement 4)
   * Must be called during or immediately after any user interaction (touch/click).
   * Unlocks both Web Audio AudioContext and Web Speech API Audio Hardware Session on iOS & Android.
   */
  public primeAutoplay(): boolean {
    if (this.isAutoplayPrimed || !this.synth) return true;

    try {
      // 1. Unpause SpeechSynthesis if locked
      if (this.synth.paused) {
        this.synth.resume();
      }

      // 2. Dispatch a micro silent utterance to claim the native audio session
      const silentUtterance = new SpeechSynthesisUtterance(' ');
      silentUtterance.volume = 0.001;
      silentUtterance.rate = 2.0;
      silentUtterance.pitch = 1.0;
      this.synth.speak(silentUtterance);

      // 3. Briefly unlock HTMLAudioElement / Web Audio context if available
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

  /**
   * Asynchronous Queue Stuck Reset (Requirement 3)
   * Safely empties queue and breaks hardware lockup via the Queue Unstuck Loop.
   */
  public forceResetSynthesisQueue() {
    if (!this.synth) return;

    try {
      if (this.chunkWatchdogTimer) {
        clearTimeout(this.chunkWatchdogTimer);
        this.chunkWatchdogTimer = null;
      }

      // 1. Resume before canceling (crucial for WebKit)
      if (this.synth.paused) {
        this.synth.resume();
      }
      this.synth.cancel();

      // 2. Queue Unstuck Loop: If speaking remains stuck true on mobile OS
      if (this.synth.speaking || this.synth.pending) {
        const unstuckDummy = new SpeechSynthesisUtterance('');
        unstuckDummy.volume = 0;
        unstuckDummy.rate = 2.0;
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
   * Mobile Voice Matcher (Requirement 2)
   * Accurately recognizes Apple native voices on iOS (Linh, Mai, Enhanced, Premium)
   * and Google voices on Android (Google Tiếng Việt, Neural, network).
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

    // 1. If explicit voice was chosen by user in Voice Selector, prioritize it if language matches
    if (this.selectedVoiceURI && langVoices.length > 0) {
      const explicitVoice = langVoices.find((v) => v.voiceURI === this.selectedVoiceURI);
      if (explicitVoice) return explicitVoice;
    }

    if (langVoices.length === 0) {
      // Return undefined so browser uses remote TTS via utterance.lang
      return undefined;
    }

    const isApple = isApplePlatform();
    const isEnhancedOrPremium = (v: SpeechSynthesisVoice) =>
      /enhanced|premium|natural|neural|high quality/i.test(v.name);
    const isAppleVoice = (v: SpeechSynthesisVoice) =>
      /apple|linh|mai|siri/i.test(v.name) || /com\.apple\./i.test(v.voiceURI);

    if (lang === 'vi') {
      // A. Apple / iOS environment
      if (isApple) {
        // Priority 1: Apple Linh or Mai with Enhanced / Premium
        const appleEnhanced = langVoices.find((v) => isAppleVoice(v) && isEnhancedOrPremium(v));
        if (appleEnhanced) return appleEnhanced;

        // Priority 2: Any Apple Linh voice (the gold standard Vietnamese iOS voice)
        const appleLinh = langVoices.find((v) => /linh/i.test(v.name) || /linh/i.test(v.voiceURI));
        if (appleLinh) return appleLinh;

        // Priority 3: Any Apple Mai voice
        const appleMai = langVoices.find((v) => /mai/i.test(v.name) || /mai/i.test(v.voiceURI));
        if (appleMai) return appleMai;

        // Priority 4: Any Apple voice
        const anyApple = langVoices.find(isAppleVoice);
        if (anyApple) return anyApple;
      }

      // B. Android / Google / Windows environment
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

      // Fallbacks
      const fallbackEnhanced = langVoices.find(isEnhancedOrPremium);
      if (fallbackEnhanced) return fallbackEnhanced;

      const fallbackApple = langVoices.find(isAppleVoice);
      if (fallbackApple) return fallbackApple;

      return langVoices[0];
    } else {
      // Foreign Languages
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

  /**
   * Main POI narration player.
   * Assembles: [Tiêu đề] + [Giới thiệu] + [Thuyết minh chi tiết]
   */
  public playNarration(
    text: string,
    lang: LanguageCode = 'vi',
    poiTitle?: string,
    _playChime: boolean = false,
    poiId?: string,
    audioUrl?: string,
    introText?: string
  ) {
    // 1. Reset and unblock queue
    this.stopPlaybackInternal();

    // Assemble complete text string
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

    // Check if a pre-recorded dedicated audio file is available
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
          console.warn('Native audio file failed, falling back to Web Speech Synthesis.');
          this.currentAudioElement = null;
          this.startChunkedSpeech(fullTextToRead, lang, 0);
        };
        audio.play().then(() => {
          this.isSpeaking = true;
          this.isPaused = false;
          this.notify();
        }).catch((err) => {
          console.warn('Audio play restricted by autoplay, falling back to Web Speech:', err);
          this.currentAudioElement = null;
          this.startChunkedSpeech(fullTextToRead, lang, 0);
        });
        return;
      } catch (e) {
        console.warn('Native audio element error, falling back to Web Speech:', e);
      }
    }

    // 2. Rolling Cascade Web Speech Synthesis
    const words = fullTextToRead.trim().split(/\s+/).filter(Boolean).length;
    this.estimatedDuration = Math.max(12, Math.round((words / (125 * this.speechRate)) * 60));

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

  /**
   * Rolling Cascade Chunking: Starts the sequential sentence-level speech queue (Requirement 1)
   */
  private startChunkedSpeech(fullText: string, lang: LanguageCode, startElapsed: number = 0) {
    if (!this.synth) {
      console.warn('SpeechSynthesis is not supported on this browser.');
      return;
    }

    // Ensure mobile audio session is primed
    this.primeAutoplay();

    // Split text into sub-clauses strictly <= 120 chars
    this.textChunks = splitTextIntoSentences(fullText, 120);
    this.currentChunkIndex = 0;
    this.sessionToken++;
    const currentSession = this.sessionToken;

    this.elapsedSeconds = startElapsed;
    this.isSpeaking = true;
    this.isPaused = false;
    this.startTimer();
    this.notify();

    // Launch cascade
    this.playNextChunk(currentSession);
  }

  /**
   * Chains next sentence chunk using `onend` and `onerror`
   */
  private playNextChunk(expectedSession: number) {
    if (this.sessionToken !== expectedSession || !this.synth) {
      return;
    }

    // All chunks finished
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

    // Clear prior utterance cleanly
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

    // DISTORTION SHIELD FOR APPLE / iOS (Requirement 2):
    // Apple voices (Linh/Mai) distort heavily if pitch != 1.0 or rate is too fast.
    const isApple = isApplePlatform() || (chosenVoice && /apple|linh|mai|siri/i.test(chosenVoice.name));
    const safePitch = isApple ? 1.0 : Math.max(0.85, Math.min(1.25, this.speechPitch));
    const safeRate = isApple
      ? Math.max(0.90, Math.min(1.10, this.speechRate))
      : Math.max(0.75, Math.min(1.35, this.speechRate));

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
      // Advance to next sentence chunk
      this.currentChunkIndex++;
      // Brief 35ms pause between sentences for authentic human breathing rhythm
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

      // Safely advance to next chunk so a single bad symbol doesn't freeze the whole narration
      this.currentChunkIndex++;
      setTimeout(() => {
        this.playNextChunk(expectedSession);
      }, 50);
    };

    // Mobile Watchdog: If a chunk is silenced without firing onend/onerror, auto-unblock
    const wordsInChunk = chunkText.split(/\s+/).length;
    const expectedDurationMs = Math.max(4500, (wordsInChunk / 2.0) * (1 / safeRate) * 1000);
    this.chunkWatchdogTimer = setTimeout(() => {
      if (this.sessionToken === expectedSession && this.isSpeaking && !this.isPaused) {
        console.warn('[AudioSpeechEngine] Chunk watchdog unblocking queue.');
        this.forceResetSynthesisQueue();
        this.currentChunkIndex++;
        this.playNextChunk(expectedSession);
      }
    }, expectedDurationMs + 3500);

    try {
      this.synth.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis speak call failed:', err);
      this.currentChunkIndex++;
      this.playNextChunk(expectedSession);
    }
  }

  /**
   * Scrubbing: maps target second to corresponding sentence chunk
   */
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
    const targetChunk = Math.min(this.textChunks.length - 1, Math.floor(ratio * this.textChunks.length));

    this.stopPlaybackInternal();
    this.sessionToken++;
    const currentSession = this.sessionToken;

    this.currentChunkIndex = targetChunk;
    this.isSpeaking = true;
    this.isPaused = false;
    this.startTimer();
    this.notify();

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

      // Safari recovery check: if resume didn't trigger audio, replay current chunk
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
        this.elapsedSeconds += 1;
        if (this.elapsedSeconds > this.estimatedDuration) {
          this.elapsedSeconds = this.estimatedDuration;
        }
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
