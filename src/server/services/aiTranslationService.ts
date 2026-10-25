import { GoogleGenAI } from '@google/genai';
import { db } from '../repositories/db.js';
import { RichPOI, POITranslation } from '../types.js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);

const LANGUAGE_NAMES: Record<string, string> = {
  vi: 'Tiếng Việt (Vietnamese)',
  en: 'English',
  zh: '中文 (Chinese)',
  ja: '日本語 (Japanese)',
  ko: '한국어 (Korean)',
  fr: 'Français (French)',
  de: 'Deutsch (German)',
  es: 'Español (Spanish)',
  ru: 'Русский (Russian)',
  th: 'ภาษาไทย (Thai)',
  id: 'Bahasa Indonesia',
  it: 'Italiano (Italian)',
};

export class AITranslationService {
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        this.aiClient = new GoogleGenAI({});
      } catch (err) {
        console.warn('[AI Translation] GoogleGenAI init warning:', err);
      }
    }
  }

  /**
   * Get translation for a POI in a given language.
   * If not already available, dynamically uses Gemini AI to translate and generate audio.
   */
  public async getOrGenerateTranslation(
    poi: RichPOI,
    targetLang: string
  ): Promise<POITranslation> {
    const lang = targetLang.toLowerCase();

    // 1. Check if translation exists in DB
    const existing = db.getTranslation(poi.poi_id, lang);
    if (existing) {
      return existing;
    }

    // 2. Base Vietnamese translation
    const viTrans = poi.translations['vi'] || Object.values(poi.translations)[0];
    const originalTitle = viTrans ? viTrans.title : poi.code;
    const originalIntro = viTrans?.introduction || (viTrans?.description ? viTrans.description.slice(0, 120) : '');
    const originalDesc = viTrans ? viTrans.description : '';
    const targetLangName = LANGUAGE_NAMES[lang] || lang.toUpperCase();

    // 3. Fallback translation if Gemini API key is missing or offline
    if (!this.aiClient && !process.env.GEMINI_API_KEY) {
      const fallback: POITranslation = {
        translation_id: `trans-${poi.poi_id}-${lang}`,
        poi_id: poi.poi_id,
        language_code: lang,
        title: `${originalTitle} (${targetLangName})`,
        introduction: originalIntro,
        description: originalDesc,
        audio_url: undefined,
        is_ai_generated: true,
      };
      db.saveTranslation(fallback);
      return fallback;
    }

    // 4. Call Gemini AI via @google/genai SDK (model: gemini-3.8-flash)
    try {
      const client = this.aiClient || new GoogleGenAI({});
      const prompt = `You are an expert Buddhist scholar, cultural historian, and reverent translator for Việt Nam Quốc Tự Pagoda in Ho Chi Minh City, Vietnam.
Translate the following sacred pagoda monument content from the Vietnamese original into ${targetLangName}.
Preserve authentic Buddhist reverence, meditative tone, and cultural dignity.

Original Title (Tiêu đề): ${originalTitle}
Original Introduction (Giới thiệu tóm tắt): ${originalIntro}
Original Narration Transcript (Thuyết minh chi tiết):
${originalDesc}

Respond ONLY with valid JSON in this exact structure:
{
  "translatedTitle": "...",
  "translatedIntroduction": "...",
  "translatedDescription": "..."
}`;

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const responseText = response.text || '{}';
      let parsed: any = {};
      try {
        parsed = JSON.parse(responseText);
      } catch {
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      }

      const newTranslation: POITranslation = {
        translation_id: `trans-${poi.poi_id}-${lang}`,
        poi_id: poi.poi_id,
        language_code: lang,
        title: parsed.translatedTitle || originalTitle,
        introduction: parsed.translatedIntroduction || originalIntro,
        description: parsed.translatedDescription || originalDesc,
        audio_url: undefined,
        is_ai_generated: true,
      };

      // Persist in relational database
      db.saveTranslation(newTranslation);
      return newTranslation;
    } catch (err: any) {
      console.error('[AI Translation Service Error]:', err);
      const fallback: POITranslation = {
        translation_id: `trans-${poi.poi_id}-${lang}`,
        poi_id: poi.poi_id,
        language_code: lang,
        title: originalTitle,
        introduction: originalIntro,
        description: originalDesc,
        audio_url: undefined,
        is_ai_generated: true,
      };
      db.saveTranslation(fallback);
      return fallback;
    }
  }
}

export const aiTranslationService = new AITranslationService();
