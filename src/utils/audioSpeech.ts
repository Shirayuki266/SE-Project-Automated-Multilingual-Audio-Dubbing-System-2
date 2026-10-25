/**
 * Sacred Buddhist Audio & Speech Synthesis Engine
 * Features:
 * - Multilingual Text-to-Speech via Web Speech API
 * - 5 Grounded Voice Engines: Chị Google, Google Cloud TTS, Bing, Giọng đọc TikTok, Giọng trình duyệt
 * - Configurable speech rate (0.7x – 1.4x) and pitch (0.7 – 1.4)
 * - Full Audio Controls: Play, Pause, Resume, Stop, Rewind 10s, Fast Forward 10s, Seek to second
 * - Native Audio URL support with fallback to Web Speech
 * - Chromium asynchronous speech queue cancellation fix (resolves single-audio stuck bug)
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
    name: 'Chị Google',
    provider: 'Google VN TTS',
    description: 'Giọng đọc Google tiếng Việt tự nhiên, quen thuộc, phát âm chuẩn xác.',
    defaultRate: 0.95,
    defaultPitch: 1.0,
  },
  {
    id: 'google-cloud',
    name: 'Google Cloud TTS',
    provider: 'AI Neural TTS',
    description: 'Ngữ điệu thông minh chuẩn AI Cloud, phong thái điềm tĩnh trang nghiêm.',
    defaultRate: 0.98,
    defaultPitch: 1.05,
  },
  {
    id: 'bing',
    name: 'Bing (Microsoft Edge)',
    provider: 'Microsoft TTS',
    description: 'Giọng đọc mượt mà phong cách Hoài My / Nam Minh, ấm áp rõ ràng.',
    defaultRate: 0.95,
    defaultPitch: 0.96,
  },
  {
    id: 'tiktok',
    name: 'Giọng đọc TikTok',
    provider: 'TikTok Narration Tone',
    description: 'Giọng thuyết minh clip ngắn lôi cuốn, nhịp điệu nhanh và trẻ trung.',
    defaultRate: 1.10,
    defaultPitch: 1.15,
  },
  {
    id: 'browser',
    name: 'Giọng trình duyệt',
    provider: 'Thiết bị hệ thống',
    description: 'Giọng đọc mặc định tích hợp sẵn trên hệ điều hành / trình duyệt thiết bị.',
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
}

export class AudioSpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private isPaused: boolean = false;
  private isSpeaking: boolean = false;

  private selectedEngine: VoiceEngineId = 'chi-google';
  private speechRate: number = 0.95;
  private speechPitch: number = 1.0;
  private selectedVoiceURI: string | null = null;

  private progressTimer: any = null;
  private pendingSpeakTimeout: any = null;

  private currentText: string = '';
  private currentLang: LanguageCode = 'vi';
  private currentTitle: string = '';
  private currentPoiId?: string;
  private estimatedDuration: number = 45;
  private elapsedSeconds: number = 0;

  private onStateChangeCallback?: (state: AudioEngineState) => void;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadSavedSettings();
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
        if (!isNaN(parsedRate)) this.speechRate = Math.max(0.7, Math.min(1.5, parsedRate));
      }
      if (savedPitch) {
        const parsedPitch = parseFloat(savedPitch);
        if (!isNaN(parsedPitch)) this.speechPitch = Math.max(0.7, Math.min(1.4, parsedPitch));
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
          this.speechRate = Math.max(0.7, Math.min(1.5, defaultSettings.rate));
        }
        if (typeof defaultSettings.pitch === 'number') {
          this.speechPitch = Math.max(0.7, Math.min(1.4, defaultSettings.pitch));
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
    return all.filter((v) => tags.some((t) => v.lang.toLowerCase().includes(t.toLowerCase())));
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

      // If audio is actively speaking TTS, replay from current position with new voice
      if (this.isSpeaking && !this.currentAudioElement) {
        this.seekTo(this.elapsedSeconds);
      } else {
        this.notify();
      }
    }
  }

  public setRate(rate: number, markUserCustom: boolean = true) {
    this.speechRate = Math.max(0.7, Math.min(1.5, Math.round(rate * 100) / 100));
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
    this.speechPitch = Math.max(0.7, Math.min(1.4, Math.round(pitch * 100) / 100));
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

  private pickVoiceForEngine(engineId: VoiceEngineId, lang: LanguageCode): SpeechSynthesisVoice | undefined {
    if (!this.synth) return undefined;
    const voices = this.synth.getVoices();
    if (voices.length === 0) return undefined;

    const preferredTags = LANG_VOICE_MAP[lang] || ['vi-VN', 'vi'];
    const langVoices = voices.filter((v) => {
      const vLang = v.lang.toLowerCase().replace('_', '-');
      return preferredTags.some((tag) => vLang.startsWith(tag.toLowerCase()) || vLang.includes(tag.toLowerCase()));
    });

    // If an explicit voice was chosen in Voice Selector, only use it if its language matches current lang!
    if (this.selectedVoiceURI && langVoices.length > 0) {
      const explicitVoice = langVoices.find((v) => v.voiceURI === this.selectedVoiceURI);
      if (explicitVoice) return explicitVoice;
    }

    if (langVoices.length === 0) {
      // Do NOT pick a voice of another language. Setting utterance.lang allows browser remote TTS.
      return undefined;
    }

    // Engine-specific matching strictly within the target language voices
    if (engineId === 'chi-google' || engineId === 'google-cloud') {
      const googleVoice = langVoices.find((v) => /google|natural|neural|cloud/i.test(v.name));
      if (googleVoice) return googleVoice;
    } else if (engineId === 'bing') {
      const msVoice = langVoices.find((v) => /microsoft|edge|bing|natural|online/i.test(v.name));
      if (msVoice) return msVoice;
    } else if (engineId === 'tiktok') {
      const upbeatVoice = langVoices.find((v) => /female|woman|girl|mai|linh|siri|samantha/i.test(v.name));
      if (upbeatVoice) return upbeatVoice;
    }

    // Default to the first native voice of the requested language
    return langVoices[0];
  }

  /**
   * Main method to play POI audio narration.
   * Assembles: [Tiêu đề] + [Giới thiệu] + [Thuyết minh chi tiết] in active language.
   * Completely excludes bogus sample bell audio or dummy URLs.
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

    // Assemble the complete spoken text: Title, Introduction, and Detailed Narration
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
    const fullTextToRead = speechSegments.length > 0 ? speechSegments.join('. ') : (text || '');

    this.currentText = fullTextToRead;
    this.currentLang = lang;
    this.currentTitle = poiTitle || '';
    this.currentPoiId = poiId;
    this.elapsedSeconds = 0;

    // Check if a dedicated recorded audio URL was provided (MUST be actual recorded file, NOT sample bell)
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
          console.warn('Native audio file failed, falling back to Web Speech Synthesis TTS.');
          this.currentAudioElement = null;
          this.speakUtteranceInternal(fullTextToRead, lang, 0);
        };
        audio.play().then(() => {
          this.isSpeaking = true;
          this.isPaused = false;
          this.notify();
        }).catch(() => {
          this.currentAudioElement = null;
          this.speakUtteranceInternal(fullTextToRead, lang, 0);
        });
        return;
      } catch (e) {
        console.warn('Error starting audio element, falling back to Web Speech:', e);
      }
    }

    // 2. Play using Web Speech Synthesis TTS
    const words = fullTextToRead.trim().split(/\s+/).filter(Boolean).length;
    this.estimatedDuration = Math.max(12, Math.round((words / (130 * this.speechRate)) * 60));

    this.speakUtteranceInternal(fullTextToRead, lang, 0);
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

  private speakUtteranceInternal(textToSpeak: string, lang: LanguageCode, startElapsed: number = 0) {
    if (!this.synth) {
      console.warn('SpeechSynthesis is not supported on this browser.');
      return;
    }

    if (this.pendingSpeakTimeout) {
      clearTimeout(this.pendingSpeakTimeout);
      this.pendingSpeakTimeout = null;
    }

    // Essential Chromium workaround: Ensure queue is cleared with a short tick
    this.pendingSpeakTimeout = setTimeout(() => {
      if (!this.synth) return;

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      this.currentUtterance = utterance;

      const chosenVoice = this.pickVoiceForEngine(this.selectedEngine, lang);
      const defaultLangTag = LANG_VOICE_MAP[lang]?.[0] || 'vi-VN';

      if (chosenVoice) {
        utterance.voice = chosenVoice;
        utterance.lang = chosenVoice.lang;
      } else {
        utterance.lang = defaultLangTag;
      }

      utterance.rate = this.speechRate;
      utterance.pitch = this.speechPitch;

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.isPaused = false;
        this.elapsedSeconds = startElapsed;
        this.startTimer();
        this.notify();
      };

      utterance.onend = () => {
        this.cleanup();
        this.notify();
      };

      utterance.onerror = (e) => {
        // If error is canceled by user action, don't crash
        if ((e as any).error !== 'canceled' && (e as any).error !== 'interrupted') {
          console.warn('SpeechSynthesis utterance event error:', e);
        }
        this.cleanup();
        this.notify();
      };

      try {
        this.synth.speak(utterance);
      } catch (err) {
        console.warn('SpeechSynthesis speak failed:', err);
      }
    }, 50);
  }

  /**
   * Seek / Scrub playback to a specific second on the seekbar
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

    // If near the end, stop
    if (clamped >= this.estimatedDuration) {
      this.stop();
      return;
    }

    // Calculate approximate text slicing based on progress percentage
    const ratio = this.estimatedDuration > 0 ? clamped / this.estimatedDuration : 0;
    const targetChar = Math.floor(ratio * this.currentText.length);

    // Find nearest space or punctuation before targetChar
    let sliceIdx = targetChar;
    if (sliceIdx > 0) {
      const prevSpace = this.currentText.lastIndexOf(' ', sliceIdx);
      if (prevSpace !== -1 && sliceIdx - prevSpace < 35) {
        sliceIdx = prevSpace + 1;
      }
    }

    const remainingText = this.currentText.slice(sliceIdx).trim();

    // Cleanly cancel ongoing speech
    try {
      if (this.synth.paused) this.synth.resume();
      this.synth.cancel();
    } catch {}

    this.stopTimer();

    if (!remainingText) {
      this.cleanup();
      this.notify();
      return;
    }

    this.speakUtteranceInternal(remainingText, this.currentLang, clamped);
  }

  /**
   * Rewind 10 seconds (Tua lùi 10s)
   */
  public rewind(seconds: number = 10) {
    this.seekTo(Math.max(0, this.elapsedSeconds - seconds));
  }

  /**
   * Fast Forward 10 seconds (Tua tới 10s)
   */
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
      this.notify();
    }
  }

  public resume() {
    if (this.currentAudioElement && this.currentAudioElement.paused) {
      this.currentAudioElement.play();
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
    }
  }

  public stop() {
    this.stopPlaybackInternal();
    this.cleanup();
    this.notify();
  }

  private stopPlaybackInternal() {
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
    this.isSpeaking = false;
    this.isPaused = false;
    this.elapsedSeconds = 0;
    this.currentUtterance = null;
  }
}

export const speechEngine = new AudioSpeechEngine();
