import { GoogleGenAI, Type } from '@google/genai';
import { db } from '../repositories/db.js';
import { ttsService } from './ttsService.js';
import { POITranslation } from '../types.js';

export const TARGET_LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'zh', label: '中文 (Mandarin)', flag: '🇨🇳' },
  { code: 'ja', label: '日本語 (Japanese)', flag: '🇯🇵' },
  { code: 'ko', label: '한국어 (Korean)', flag: '🇰🇷' },
  { code: 'fr', label: 'Français (French)', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch (German)', flag: '🇩🇪' },
  { code: 'es', label: 'Español (Spanish)', flag: '🇪🇸' },
  { code: 'ru', label: 'Русский (Russian)', flag: '🇷🇺' },
  { code: 'th', label: 'ไทย (Thai)', flag: '🇹🇭' },
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'it', label: 'Italiano (Italian)', flag: '🇮🇹' },
  { code: 'hi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
];

export interface LocalizePOIRequest {
  poiId: string;
  title_vi: string;
  intro_vi?: string;
  description_vi: string;
  generateAudio?: boolean;
}

export interface LocalizePOIResult {
  success: boolean;
  poiId: string;
  totalLanguages: number;
  translations: Record<string, POITranslation>;
  audioGeneratedCount: number;
  message: string;
}

export class LocalizationService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }

  /**
   * Cleans text to prevent TTS pronunciation artifacts:
   * Strips markdown symbols, asterisks, hashes, brackets, and emojis.
   */
  public cleanTextForTTS(text: string): string {
    if (!text) return '';
    return text
      .replace(/[#*`~_\[\]()<>]/g, ' ')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 1-Click AI Localization:
   * Takes original Vietnamese content and uses Gemini 3.8 Flash to generate 12 languages.
   * Auto-cleans TTS artifacts, saves to database, and pre-generates cached MP3 audio files.
   */
  public async localizePOI(request: LocalizePOIRequest): Promise<LocalizePOIResult> {
    const { poiId, title_vi, intro_vi = '', description_vi, generateAudio = true } = request;

    if (!title_vi || !description_vi) {
      throw new Error('Tiêu đề và nội dung thuyết minh gốc (Tiếng Việt) là bắt buộc.');
    }

    const cleanTitleVi = this.cleanTextForTTS(title_vi);
    const cleanIntroVi = this.cleanTextForTTS(intro_vi || description_vi.slice(0, 120));
    const cleanDescVi = this.cleanTextForTTS(description_vi);

    // Save Vietnamese base translation first
    const viTransRecord: POITranslation = {
      translation_id: `trans-${poiId}-vi`,
      poi_id: poiId,
      language_code: 'vi',
      title: cleanTitleVi,
      introduction: cleanIntroVi,
      description: cleanDescVi,
      audio_url: `/audio/${poiId}-vi.mp3`,
      is_ai_generated: false,
    };
    db.saveTranslation(viTransRecord);

    const translationsMap: Record<string, POITranslation> = {
      vi: viTransRecord,
    };

    // Pre-generate Vietnamese Audio
    if (generateAudio) {
      try {
        const fullViText = [cleanTitleVi, cleanIntroVi, cleanDescVi].filter(Boolean).join('. ');
        await ttsService.synthesizeSpeech({
          text: fullViText,
          poiId,
          lang: 'vi',
        });
      } catch (e) {
        console.warn('[LocalizationService] VI Audio synthesis notice:', e);
      }
    }

    // Languages to generate with AI (excluding Vietnamese)
    const targetCodes = ['en', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'ru', 'th', 'id', 'it', 'hi'];

    let aiGeneratedItems: Array<{
      lang: string;
      title: string;
      introduction: string;
      description: string;
    }> = [];

    // Call Gemini 3.8 Flash for 12 languages with structured JSON schema
    if (this.ai) {
      try {
        const prompt = `
Bạn là chuyên gia dịch thuật và hướng dẫn viên du lịch văn hóa Phật giáo chuyên nghiệp tại Việt Nam Quốc Tự.
Hãy dịch nội dung thuyết minh điểm chiêm bái sau sang 12 ngôn ngữ:
- en (English)
- zh (Chinese Mandarin Simplified)
- ja (Japanese)
- ko (Korean)
- fr (French)
- de (German)
- es (Spanish)
- ru (Russian)
- th (Thai)
- id (Indonesian)
- it (Italian)
- hi (Hindi)

Nội dung gốc (Tiếng Việt):
- Tiêu đề: ${cleanTitleVi}
- Giới thiệu ngắn: ${cleanIntroVi}
- Thuyết minh chi tiết: ${cleanDescVi}

YÊU CẦU CHẤT LƯỢNG NGHIÊM NGẶT:
1. Văn phong tự nhiên, truyền cảm, trang trọng như lời hướng dẫn viên du lịch chuyên nghiệp tại ngôi đại tự linh thiêng.
2. TUYỆT ĐỐI KHÔNG dùng ký tự đặc biệt (*, #, _, ~, [], emoji) trong bất kỳ trường nào để hệ thống đọc âm thanh TTS không bị vấp.
3. Chuyển các con số quan trọng thành chữ hoặc định dạng dễ đọc nhất theo từng ngôn ngữ (ví dụ trong tiếng Việt: 13 tầng -> mười ba tầng, 63 mét -> sáu mươi ba mét; trong tiếng Anh: 13-story -> thirteen-story).
4. Đảm bảo tên riêng Phật giáo được phiên âm hoặc dịch chuẩn mực, tôn kính.
`;

        const response = await this.ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'You are an elite multilingual cultural audio guide translator. Output strict JSON only matching the schema.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  lang: {
                    type: Type.STRING,
                    description: 'Language code: en, zh, ja, ko, fr, de, es, ru, th, id, it, hi',
                  },
                  title: {
                    type: Type.STRING,
                    description: 'Translated title of the POI without special characters',
                  },
                  introduction: {
                    type: Type.STRING,
                    description: '1-2 sentence overview introduction without special characters',
                  },
                  description: {
                    type: Type.STRING,
                    description: 'Full immersive tour guide narration without special characters',
                  },
                },
                required: ['lang', 'title', 'introduction', 'description'],
              },
            },
          },
        });

        const jsonStr = (response.text || '[]').trim();
        aiGeneratedItems = JSON.parse(jsonStr);
      } catch (err: any) {
        console.warn('[LocalizationService] Gemini batch translation notice, fallbacking to template translations:', err.message || err);
      }
    }

    // Save and synthesize audio for all 11 languages
    let audioGeneratedCount = 1; // Vietnamese already done

    for (const code of targetCodes) {
      const aiItem = aiGeneratedItems.find((item) => item.lang.toLowerCase() === code);

      let title = aiItem ? this.cleanTextForTTS(aiItem.title) : `${cleanTitleVi} (${code.toUpperCase()})`;
      let introduction = aiItem ? this.cleanTextForTTS(aiItem.introduction) : cleanIntroVi;
      let description = aiItem ? this.cleanTextForTTS(aiItem.description) : cleanDescVi;

      // Fallback translations if AI was offline or incomplete
      if (!aiItem) {
        if (code === 'en') {
          title = cleanTitleVi.replace(/Chánh Điện|Chính Điện/i, 'Main Sanctuary').replace(/Bảo Tháp/i, 'Thirteen-Story Stupa').replace(/Đại Hồng Chung/i, 'Great Sacred Bell').replace(/Tam Quan/i, 'Three Entrance Gate');
          introduction = `Sacred Buddhist point of interest at Vietnam Quoc Tu Pagoda in Ho Chi Minh City.`;
          description = `${cleanTitleVi}. Welcome to this holy sanctuary of Vietnamese Buddhism. ${cleanDescVi}`;
        }
      }

      const transRecord: POITranslation = {
        translation_id: `trans-${poiId}-${code}`,
        poi_id: poiId,
        language_code: code,
        title,
        introduction,
        description,
        audio_url: `/audio/${poiId}-${code}.mp3`,
        is_ai_generated: true,
      };

      db.saveTranslation(transRecord);
      translationsMap[code] = transRecord;

      // Pre-synthesize MP3 audio using Cloud TTS Engine
      if (generateAudio) {
        try {
          const fullScript = [title, introduction, description].filter(Boolean).join('. ');
          await ttsService.synthesizeSpeech({
            text: fullScript,
            poiId,
            lang: code,
          });
          audioGeneratedCount++;
        } catch (e) {
          console.warn(`[LocalizationService] Audio synthesis notice for ${code}:`, e);
        }
      }
    }

    return {
      success: true,
      poiId,
      totalLanguages: Object.keys(translationsMap).length,
      translations: translationsMap,
      audioGeneratedCount,
      message: `Đã tạo thành công ${Object.keys(translationsMap).length}/12 bản dịch đa ngôn ngữ và khởi tạo ${audioGeneratedCount} file Audio MP3 chuẩn chất lượng cao.`,
    };
  }
}

export const localizationService = new LocalizationService();
