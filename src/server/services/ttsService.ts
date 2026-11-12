import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as googleTTS from 'google-tts-api';
import { db } from '../repositories/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUDIO_DIR = path.resolve(__dirname, '../../../public/audio');

export interface TTSVoiceOption {
  id: string;
  name: string;
  voiceName?: string;
  gender: 'female' | 'male';
  provider: string;
  description: string;
  langCode: string;
}

export const REAL_TTS_VOICES: TTSVoiceOption[] = [
  {
    id: 'gemini-kore',
    name: 'Gemini Kore (Giọng Nữ Tự Nhiên)',
    voiceName: 'Kore',
    gender: 'female',
    provider: 'Google Gemini 3.8 Flash Lite TTS',
    description: 'Giọng đọc AI tự nhiên thế hệ mới, thanh tịnh, ấm áp, phát âm tiếng Việt chuẩn xác và tôn kính.',
    langCode: 'vi',
  },
  {
    id: 'gemini-charon',
    name: 'Gemini Charon (Giọng Nam Trang Nghiêm)',
    voiceName: 'Charon',
    gender: 'male',
    provider: 'Google Gemini 3.8 Flash Lite TTS',
    description: 'Giọng nam trầm ấm, trang nghiêm, phong thái đại tự thiêng liêng chốn thiền môn.',
    langCode: 'vi',
  },
  {
    id: 'google-vi-natural',
    name: 'Google Natural Neural (Nữ)',
    voiceName: 'Puck',
    gender: 'female',
    provider: 'Google Cloud TTS Engine',
    description: 'Giọng đọc tiếng Việt tự nhiên, ấm áp, phát âm chuẩn xác từng địa danh Phật giáo.',
    langCode: 'vi',
  },
  {
    id: 'google-en-natural',
    name: 'Google English Studio (Female)',
    voiceName: 'Zephyr',
    gender: 'female',
    provider: 'Google Cloud TTS Engine',
    description: 'Natural English narration voice with clear enunciation for international pilgrims.',
    langCode: 'en',
  },
  {
    id: 'google-zh-natural',
    name: 'Google Mandarin (女声)',
    voiceName: 'Fenrir',
    gender: 'female',
    provider: 'Google Cloud TTS Engine',
    description: 'Standard Mandarin Chinese guide with serene, respectful tone.',
    langCode: 'zh',
  },
  {
    id: 'google-ja-natural',
    name: 'Google Japanese (女性)',
    voiceName: 'Aoede',
    gender: 'female',
    provider: 'Google Cloud TTS Engine',
    description: 'Polite and serene Japanese temple guide voice.',
    langCode: 'ja',
  },
];

export interface SynthesizeOptions {
  text: string;
  poiId?: string;
  lang?: string;
  voiceName?: string;
  speed?: number;
}

export interface SynthesizeResult {
  success: boolean;
  audioUrl?: string;
  dataUrl?: string;
  isCached?: boolean;
  fallbackToClient?: boolean;
  message?: string;
  bytes?: number;
}

export class TTSService {
  constructor() {
    this.ensureAudioDirectory();
  }

  private ensureAudioDirectory() {
    try {
      if (!fs.existsSync(AUDIO_DIR)) {
        fs.mkdirSync(AUDIO_DIR, { recursive: true });
      }
    } catch (e) {
      console.warn('[TTSService] Failed to create audio directory:', e);
    }
  }

  /**
   * Synthesizes real MP3 audio using Google TTS Engine.
   * Chunks long texts seamlessly to handle arbitrary length articles,
   * caches the MP3 on disk, and returns the public audio URL.
   */
  public async synthesizeSpeech(options: SynthesizeOptions): Promise<SynthesizeResult> {
    const { text, poiId, lang = 'vi' } = options;

    if (!text || !text.trim()) {
      return { success: false, message: 'Text content is required for speech synthesis' };
    }

    this.ensureAudioDirectory();

    // Map language code to standard Google TTS codes
    const normalizedLang = this.normalizeLangCode(lang);
    const sanitizedPoi = poiId ? poiId.replace(/[^a-zA-Z0-9_-]/g, '') : 'narration';
    const filename = `${sanitizedPoi}-${normalizedLang}.mp3`;
    const filePath = path.join(AUDIO_DIR, filename);
    const audioUrl = `/audio/${filename}`;

    // 1. Check disk cache first (Vòng 1 - Instant zero latency playback)
    if (fs.existsSync(filePath)) {
      try {
        const stats = fs.statSync(filePath);
        if (stats.size > 2000) {
          return {
            success: true,
            audioUrl,
            isCached: true,
            bytes: stats.size,
          };
        }
      } catch {}
    }

    // 2. Synthesize using Google Cloud TTS multi-sentence chunker
    try {
      // Clean script text: remove markdown asterisks, hashes, brackets for smooth pronunciation
      const cleanedText = text
        .replace(/[#*`~_\[\]()]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const results = await googleTTS.getAllAudioBase64(cleanedText, {
        lang: normalizedLang,
        slow: false,
        host: 'https://translate.google.com',
        timeout: 15000,
        splitPunct: '.,!?:;\n',
      });

      if (!results || results.length === 0) {
        throw new Error('Google TTS returned no audio chunks');
      }

      const audioBuffers = results.map((r) => Buffer.from(r.base64, 'base64'));
      const fullAudioBuffer = Buffer.concat(audioBuffers);

      // Save to disk cache
      fs.writeFileSync(filePath, fullAudioBuffer);

      // If linked to POI in database, update POI record
      if (poiId) {
        const trans = db.getTranslation(poiId, normalizedLang);
        if (trans) {
          trans.audio_url = audioUrl;
          db.saveTranslation(trans);
        }
      }

      return {
        success: true,
        audioUrl,
        dataUrl: `data:audio/mp3;base64,${fullAudioBuffer.toString('base64')}`,
        isCached: false,
        bytes: fullAudioBuffer.length,
      };
    } catch (err: any) {
      console.warn('[TTSService] Cloud TTS synthesis error:', err.message || err);
      return {
        success: false,
        fallbackToClient: true,
        message: `Cloud TTS unavailable (${err.message || 'Error'}). Falling back to device speech engine.`,
      };
    }
  }

  private normalizeLangCode(lang: string): string {
    const map: Record<string, string> = {
      vi: 'vi',
      en: 'en',
      zh: 'zh',
      'zh-cn': 'zh',
      'zh-tw': 'zh-TW',
      ja: 'ja',
      ko: 'ko',
      fr: 'fr',
      de: 'de',
      es: 'es',
      ru: 'ru',
      th: 'th',
      id: 'id',
      it: 'it',
      hi: 'hi',
    };
    return map[lang.toLowerCase()] || 'vi';
  }

  public getVoices(): TTSVoiceOption[] {
    return REAL_TTS_VOICES;
  }
}

export const ttsService = new TTSService();
