/**
 * Sacred Buddhist Audio & Speech Synthesis Engine
 * Mobile-Optimized for iOS Safari, Android Chrome, and Desktop Browsers.
 *
 * Key Capabilities & Bug Fixes:
 * 1. Rolling Cascade Chunking: Splits long narration into sentence-level chunks (~120-150 chars)
 *    and chains them sequentially via `utterance.onend`. Eliminates mobile audio buffer crashes
 *    and the notorious 15-second mobile SpeechSynthesis freeze.
 * 2. Cross-Platform Voice Matcher (`pickVoiceForEngine`):
 *    - iOS / iPadOS: Natively detects high-quality Apple voices (Linh, Mai, Enhanced, Premium, Siri)
 *    - Android: Detects Google Tiếng Việt (vic-network, vif-network, gft-local)
 *    - Windows/Edge: Detects Microsoft HoaiMy Online / NamMinh Online
 *    - Mobile Distortion Shield: Auto-clamps pitch (0.92 - 1.08) and rate (0.85 - 1.20) for Apple
 *      voices to prevent robotic/chipmunk distortion.
 * 3. Mobile Queue Unblocker & Watchdog:
 *    - `forceResetSynthesisQueue()` clears hung asynchronous SpeechSynthesis queues
 *    - `unlockMobileAudio()` primes audio context on initial user gesture (touch/click)
 *    - Session tokening prevents race conditions on rapid POI switches or scrubbing.
 * 4. Full Audio Controls: Play, Pause, Resume, Stop, Rewind, Fast Forward, Chunk-level Scrubbing.
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
    name: 'Chị Google / Giọng Chuẩn',
    provider: 'Google VN & Apple Linh',
    description: 'Giọng đọc tiếng Việt tự nhiên, ấm áp, tối ưu hóa cho cả Android và iOS.',
    defaultRate: 0.96,
    defaultPitch: 1.0,
  },
  {
    id: 'google-cloud',
    name: 'Google Cloud / AI Neural',
    provider: 'AI Neural TTS',
    description: 'Ngữ điệu thông minh chuẩn AI Cloud, phong thái điềm tĩnh, trang nghiêm.',
    defaultRate: 0.98,
    defaultPitch: 1.02,
  },
  {
    id: 'bing',
    name: 'Microsoft Hoài My / Bing',
    provider: 'Microsoft Natural TTS',
    description: 'Giọng đọc mượt mà phong cách Hoài My / Nam Minh, truyền cảm và rõ ràng.',
    defaultRate: 0.95,
    defaultPitch: 0.98,
  },
  {
    id: 'tiktok',
    name: 'Giọng Thuyết Minh Truyền Cảm',
    provider: 'Apple Mai / Siri / Narration',
    description: 'Giọng đọc thanh thoát, lôi cuốn, ngắt nghỉ câu văn linh hoạt.',
    defaultRate: 1.02,
    defaultPitch: 1.05,
  },
  {
    id: 'browser',
    name: 'Giọng Thiết Bị Bản Địa',
    provider: 'Hệ điều hành thiết bị',
    description: 'Sử dụng giọng đọc mặc định có sẵn trên hệ điều hành điện thoại/máy tính.',
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
 * Intelligent text splitting for Mobile Speech Synthesis
 * Breaks text into natural spoken phrases (~100-140 chars) around punctuation marks (. ! ? ; , - \n)
 * Prevents mobile browser speech synthesis buffer overflow and 15s timeout cutoff.
 */
export function splitTextIntoSentences(text: string, maxLen: number = 135): string[] {
  if (!text || !text.trim()) return [];

  // Normalize spaces and convert line breaks to periods if missing
  const normalized = text
    .replace(/\r\n|\r|\n/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();

  // Match sentences ending in . ! ? ; or end of string
  const rawSentences = normalized.match(/[^.!?;\u3002\uFF01\uFF1F]+[.!?;\u3002\uFF01\uFF1F]*|[^.!?;\u3002\uFF01\uFF1F]+$/g) || [normalized];
  const chunks: string[] = [];

  for (const raw of rawSentences) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    if (trimmed.length <= maxLen) {
      chunks.push(trimmed);
    } else {
      // Split large sentence by commas, colons, or dashes
      const subParts = trimmed.match(/[^,:\uFF0C\uFF1A\-]+[,:\uFF0C\uFF1A\-]*|[^,:\uFF0C\uFF1A\-]+$/g) || [trimmed];
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
            // As a last resort, split by words
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

  return chunks.length > 0 ? chunks : [normalized];
}

export class AudioSpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private isPaused: boolean = false;
  private isSpeaking: boolean = false;

  private selectedEngine: VoiceEngineId = 'chi-google';
  private speechRate: number = 0.96;
  private speechPitch: number = 1.0;
  private selectedVoiceURI: string | null = null;

  private progressTimer: any = null;
  private chunkWatchdogTimer: any = null;
  private pendingSpeakTimeout: any = null;

  // Chunking state
  private textChunks: string[] = [];
  private currentChunkIndex: number = 0;
  private sessionToken: number = 0;

  private currentText: string = '';
  private currentLang: LanguageCode = 'vi';
  private currentTitle: string = '';
  private currentPoiId?: string;
  private estimatedDuration: number = 45;
  private elapsedSeconds: number = 0;

  private isAudioUnlocked: boolean = false;
  private onStateChangeCallback?: (state: AudioEngineState) => void;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadSavedSettings();
      this.attachAutoplayUnlocker();

      // Listen for voice catalog readiness
      if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = () => {
          // Pre-load available system voices into memory
          this.getAvailableSystemVoices();
        };
      }

      // Handle mobile visibility change (screen lock/unlock or tab switch)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          // Keep state consistent when backgrounded
          if (this.isSpeaking && !this.isPaused && this.synth?.speaking) {
            // Modern WebKit allows background speech if not paused, but resume if paused
            if (this.synth.paused) {
              try {
                this.synth.resume();
              } catch {}
            }
          }
        } else {
          // Returning to tab: check if speech was paused by OS
          if (this.isSpeaking && !this.isPaused && this.synth) {
            if (this.synth.paused) {
              try {
                this.synth.resume();
              } catch {}
            }
          }
        }
      });
    }
  }

  /**
   * One-time user gesture handler to unlock Web Audio & SpeechSynthesis on iOS Safari & Chrome Mobile.
   * Browsers strictly reject speech until at least one user gesture occurs on the document.
   */
  private attachAutoplayUnlocker() {
    if (typeof window === 'undefined') return;

    const unlockHandler = () => {
      this.unlockMobileAudio();
      window.removeEventListener('touchstart', unlockHandler);
      window.removeEventListener('pointerdown', unlockHandler);
      window.removeEventListener('click', unlockHandler);
    };

    window.addEventListener('touchstart', unlockHandler, { passive: true, capture: true });
    window.addEventListener('pointerdown', unlockHandler, { passive: true, capture: true });
    window.addEventListener('click', unlockHandler, { passive: true, capture: true });
  }

  /**
   * Directly unlock mobile audio context with a lightweight blank speech utterance.
   */
  public unlockMobileAudio() {
    if (this.isAudioUnlocked || !this.synth) return;
    try {
      if (this.synth.paused) {
        this.synth.resume();
      }
      // Speak a brief blank utterance with zero volume to authorize the audio session
      const primer = new SpeechSynthesisUtterance(' ');
      primer.volume = 0.01;
      primer.rate = 2.0;
      this.synth.speak(primer);
      this.isAudioUnlocked = true;
    } catch (e) {
      // Ignore initial touch errors
    }
  }

  /**
   * Force-reset the SpeechSynthesis queue if mobile browser gets stuck.
   * Resolves the iOS/Android "stuck in speaking=true with zero audio" bug.
   */
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

      // Dispatch an instant silent utterance to kickstart WebKit's internal audio queue
      const kick = new SpeechSynthesisUtterance('');
      kick.volume = 0;
      this.synth.speak(kick);
      this.synth.cancel();
    } catch (err) {
      console.warn('[AudioSpeechEngine] forceResetSynthesisQueue notice:', err);
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
    } catch (e) {
      // Ignore localStorage errors
    }
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
    } catch (e) {
      // Ignore error
    }
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
      } catch (e) {}

      // If audio is actively speaking TTS, replay current chunk with new voice
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
    } catch (e) {}
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
    } catch (e) {}
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
    } catch (e) {}
    this.notify();
  }

  /**
   * Cross-platform voice selector.
   * Accurately recognizes Apple iOS voices (Linh, Mai, Siri) alongside Google & Microsoft voices.
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
      // Never force a voice of an incompatible language.
      // Returning undefined allows the browser to trigger remote TTS via `utterance.lang`.
      return undefined;
    }

    // iOS Apple voice helpers
    const isAppleVoice = (v: SpeechSynthesisVoice) =>
      /apple|linh|mai|siri/i.test(v.name) || /com\.apple\./i.test(v.voiceURI);
    const isEnhancedOrPremium = (v: SpeechSynthesisVoice) =>
      /enhanced|premium|natural|neural|high quality/i.test(v.name);

    if (lang === 'vi') {
      // Vietnamese Voice Prioritization
      if (engineId === 'chi-google' || engineId === 'google-cloud') {
        // Look for Google Vietnamese first
        const googleVoice = langVoices.find((v) => /google|vic-network|vif-network|gft-local/i.test(v.name));
        if (googleVoice) return googleVoice;

        // On iOS: Look for Apple Linh / Mai Enhanced or Premium
        const appleEnhanced = langVoices.find((v) => isAppleVoice(v) && isEnhancedOrPremium(v));
        if (appleEnhanced) return appleEnhanced;

        // Any Apple Linh or Mai
        const appleStandard = langVoices.find((v) => /linh|mai/i.test(v.name));
        if (appleStandard) return appleStandard;

        // Microsoft Hoài My or Nam Minh
        const msVoice = langVoices.find((v) => /hoaimy|namminh|microsoft.*natural/i.test(v.name));
        if (msVoice) return msVoice;
      } else if (engineId === 'bing') {
        // Microsoft Edge Natural Voices
        const msVoice = langVoices.find((v) => /microsoft|edge|bing|hoaimy|namminh|online.*natural/i.test(v.name));
        if (msVoice) return msVoice;

        const enhancedVoice = langVoices.find(isEnhancedOrPremium);
        if (enhancedVoice) return enhancedVoice;

        const appleLinh = langVoices.find((v) => /linh/i.test(v.name));
        if (appleLinh) return appleLinh;
      } else if (engineId === 'tiktok') {
        // Youthful / Expressive: Apple Mai or Siri or high-frequency voice
        const upbeatVoice = langVoices.find((v) => /mai|siri|female|vif-network/i.test(v.name));
        if (upbeatVoice) return upbeatVoice;

        const anyLinh = langVoices.find((v) => /linh/i.test(v.name));
        if (anyLinh) return anyLinh;
      }

      // Default fallback: prioritize Enhanced/Premium if available, else first Vietnamese voice
      const enhancedFallback = langVoices.find(isEnhancedOrPremium);
      if (enhancedFallback) return enhancedFallback;

      const appleFallback = langVoices.find(isAppleVoice);
      if (appleFallback) return appleFallback;

      return langVoices[0];
    } else {
      // Other Languages (English, Chinese, Japanese, etc.)
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
   * Main entry point to play POI audio narration.
   * Concatenates: [Tiêu đề] + [Giới thiệu] + [Thuyết minh chi tiết]
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
    // 1. Fully cancel & reset previous audio / speech
    this.stopPlaybackInternal();

    // Assemble the complete spoken text
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

    // Check if a dedicated recorded audio URL was provided
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
          console.warn('Audio play prevented (Autoplay restriction):', err);
          this.currentAudioElement = null;
          this.startChunkedSpeech(fullTextToRead, lang, 0);
        });
        return;
      } catch (e) {
        console.warn('Error starting audio element, falling back to Web Speech:', e);
      }
    }

    // 2. Play using Rolling Cascade Web Speech Synthesis
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
   * Initializes sentence-level chunking and launches the rolling cascade.
   */
  private startChunkedSpeech(fullText: string, lang: LanguageCode, startElapsed: number = 0) {
    if (!this.synth) {
      console.warn('SpeechSynthesis is not supported on this browser.');
      return;
    }

    // Unlock audio context on user gesture if not yet done
    this.unlockMobileAudio();

    // Split text into safe, bite-sized mobile chunks
    this.textChunks = splitTextIntoSentences(fullText, 135);
    this.currentChunkIndex = 0;
    this.sessionToken++;
    const currentSession = this.sessionToken;

    this.elapsedSeconds = startElapsed;
    this.isSpeaking = true;
    this.isPaused = false;
    this.startTimer();
    this.notify();

    // Kick off chunk sequence
    this.playNextChunk(currentSession);
  }

  /**
   * Plays the next chunk in the sequence. Chunks cascade via `utterance.onend`.
   */
  private playNextChunk(expectedSession: number) {
    if (this.sessionToken !== expectedSession || !this.synth) {
      return;
    }

    // Check if all chunks have finished
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

    // Clean any prior pending utterance without freezing queue
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

    // MOBILE DISTORTION SHIELD:
    // Apple iOS voices (Linh / Mai) heavily distort / become robotic if pitch != 1.0 or rate is too fast.
    const isApple = chosenVoice && (/apple|linh|mai|siri/i.test(chosenVoice.name) || /com\.apple\./i.test(chosenVoice.voiceURI));
    const safePitch = isApple ? Math.max(0.94, Math.min(1.06, this.speechPitch)) : this.speechPitch;
    const safeRate = isApple ? Math.max(0.88, Math.min(1.15, this.speechRate)) : this.speechRate;

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
      // Advance to next chunk
      this.currentChunkIndex++;
      // Minimal 40ms pause between chunks for natural human breathing rhythm
      setTimeout(() => {
        this.playNextChunk(expectedSession);
      }, 40);
    };

    utterance.onerror = (e) => {
      if (this.sessionToken !== expectedSession) return;
      if ((e as any).error === 'canceled' || (e as any).error === 'interrupted') {
        return;
      }

      console.warn(`[Speech Chunk Error - chunk ${this.currentChunkIndex}]:`, (e as any).error);
      if (this.chunkWatchdogTimer) {
        clearTimeout(this.chunkWatchdogTimer);
        this.chunkWatchdogTimer = null;
      }

      // If a single chunk errors (e.g. unsupported character or timeout), safely advance to next chunk
      this.currentChunkIndex++;
      setTimeout(() => {
        this.playNextChunk(expectedSession);
      }, 60);
    };

    // Mobile Watchdog: if a chunk hangs without triggering onend/onerror within a safety window, unblock
    const wordsInChunk = chunkText.split(/\s+/).length;
    const expectedSec = Math.max(5, (wordsInChunk / 2.2) * (1 / safeRate));
    this.chunkWatchdogTimer = setTimeout(() => {
      if (this.sessionToken === expectedSession && this.isSpeaking && !this.isPaused) {
        console.warn('[AudioSpeechEngine] Chunk watchdog triggered — unblocking hung speech queue.');
        this.forceResetSynthesisQueue();
        this.currentChunkIndex++;
        this.playNextChunk(expectedSession);
      }
    }, (expectedSec + 4) * 1000);

    try {
      this.synth.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis speak failed:', err);
      this.currentChunkIndex++;
      this.playNextChunk(expectedSession);
    }
  }

  /**
   * Seek / Scrub playback to a specific second on the seekbar.
   * Maps timestamp to the corresponding text chunk and resumes speech smoothly.
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

    // Determine target chunk index based on elapsed ratio
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
        // Modern WebKit sometimes doesn't resume smoothly after pause; if so, re-trigger current chunk
        this.synth.resume();
      } catch {}
      this.isPaused = false;
      this.startTimer();
      this.notify();

      // If synthesizer failed to resume within 300ms, replay current chunk cleanly
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

    if (this.pendingSpeakTimeout) {
      clearTimeout(this.pendingSpeakTimeout);
      this.pendingSpeakTimeout = null;
    }

    if (this.synth) {
      try {
        if (this.synth.paused) {
          this.synth.resume();
        }
        this.synth.cancel();
      } catch {}
    }
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
