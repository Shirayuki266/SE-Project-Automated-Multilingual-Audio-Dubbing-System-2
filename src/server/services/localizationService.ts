import { GoogleGenAI, Type } from '@google/genai';
import { db } from '../repositories/db.js';
import { ttsService } from './ttsService.js';
import { POITranslation } from '../types.js';
import { SUPPORTED_LANGUAGES, TARGET_TRANSLATION_LANGUAGES } from '../../config/languages.js';

export const TARGET_LANGUAGES = SUPPORTED_LANGUAGES;

export interface LocalizePOIRequest {
  poiId: string;
  title_vi: string;
  intro_vi?: string;
  description_vi: string;
  generateAudio?: boolean;
  forceOverwriteManual?: boolean;
}

export interface LanguageLocalizationStatus {
  lang: string;
  label: string;
  status: 'success' | 'skipped_manual' | 'failed';
  audioGenerated: boolean;
  error?: string;
}

export interface LocalizePOIResult {
  success: boolean;
  poiId: string;
  totalLanguages: number;
  translations: Record<string, POITranslation>;
  audioGeneratedCount: number;
  languageStatuses: LanguageLocalizationStatus[];
  failedLanguages: Array<{ lang: string; error: string }>;
  message: string;
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries: number = 2, baseDelayMs: number = 1000): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, baseDelayMs * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const runWorker = async () => {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await worker(items[current]);
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker());
  await Promise.all(workers);
  return results;
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
   * Regenerates MP3 audio for a single POI + language (used when Admin edits text manually).
   */
  public async regenerateSingleAudio(poiId: string, lang: string) {
    const poi = db.getRichPOIById(poiId);
    if (!poi) {
      throw new Error(`Không tìm thấy điểm POI với mã "${poiId}".`);
    }
    const normalizedCode = lang.toLowerCase() === 'zh-cn' ? 'zh' : lang.toLowerCase();
    const trans = poi.translations[normalizedCode];
    if (!trans) {
      throw new Error(`Chưa có bản dịch cho ngôn ngữ "${lang}". Vui lòng lưu bài viết trước.`);
    }

    const fullText = [
      this.cleanTextForTTS(trans.title),
      this.cleanTextForTTS(trans.introduction || ''),
      this.cleanTextForTTS(trans.description),
    ]
      .filter(Boolean)
      .join('. ');

    const synthResult = await withRetry(
      () =>
        ttsService.synthesizeSpeech({
          text: fullText,
          poiId,
          lang: normalizedCode,
          forceRegenerate: true,
        }),
      1,
      800
    );

    if (!synthResult.success || !synthResult.audioUrl) {
      throw new Error(synthResult.message || `Không thể tạo lại audio cho ngôn ngữ ${lang}`);
    }

    const updatedTrans: POITranslation = {
      ...trans,
      audio_url: synthResult.audioUrl,
      updated_at: new Date().toISOString(),
    };
    db.saveTranslation(updatedTrans);

    return {
      success: true,
      poiId,
      lang: normalizedCode,
      audioUrl: synthResult.audioUrl,
      bytes: synthResult.bytes,
      message: `Đã tạo lại file Audio MP3 cho [${normalizedCode.toUpperCase()}] thành công.`,
    };
  }

  /**
   * 1-Click AI Localization:
   * - Uses centralized SUPPORTED_LANGUAGES config (12 target languages).
   * - Respects `is_manually_edited` so manual edits are never overwritten unless `forceOverwriteManual` is true.
   * - Uses Gemini structured JSON output + retry + concurrency-limited audio synthesis + per-language status.
   */
  public async localizePOI(request: LocalizePOIRequest): Promise<LocalizePOIResult> {
    const {
      poiId,
      title_vi,
      intro_vi = '',
      description_vi,
      generateAudio = true,
      forceOverwriteManual = false,
    } = request;

    if (!title_vi || !description_vi) {
      throw new Error('Tiêu đề và nội dung thuyết minh gốc (Tiếng Việt) là bắt buộc.');
    }

    const existingPoi = db.getRichPOIById(poiId);
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
      is_manually_edited: true,
      updated_at: new Date().toISOString(),
    };
    db.saveTranslation(viTransRecord);

    const translationsMap: Record<string, POITranslation> = {
      vi: viTransRecord,
    };

    const languageStatuses: LanguageLocalizationStatus[] = [];
    const failedLanguages: Array<{ lang: string; error: string }> = [];
    let audioGeneratedCount = 0;

    // Pre-generate Vietnamese Audio
    let viAudioOk = false;
    if (generateAudio) {
      try {
        const fullViText = [cleanTitleVi, cleanIntroVi, cleanDescVi].filter(Boolean).join('. ');
        const res = await withRetry(
          () =>
            ttsService.synthesizeSpeech({
              text: fullViText,
              poiId,
              lang: 'vi',
              forceRegenerate: true,
            }),
          1,
          800
        );
        viAudioOk = Boolean(res.success);
        if (viAudioOk) audioGeneratedCount++;
      } catch (e: any) {
        console.warn('[LocalizationService] VI Audio synthesis notice:', e?.message || e);
      }
    }
    languageStatuses.push({
      lang: 'vi',
      label: 'Tiếng Việt',
      status: 'success',
      audioGenerated: viAudioOk,
    });

    // Filter languages that need AI translation (skip manually edited unless forced)
    const languagesToTranslate = TARGET_TRANSLATION_LANGUAGES.filter((cfg) => {
      const existing = existingPoi?.translations[cfg.code];
      return forceOverwriteManual || !existing?.is_manually_edited;
    });

    let aiGeneratedItems: Array<{
      lang: string;
      title: string;
      introduction: string;
      description: string;
    }> = [];

    let batchAiError: string | undefined;

    if (this.ai && languagesToTranslate.length > 0) {
      try {
        const langListText = languagesToTranslate
          .map((l) => `- ${l.geminiCode} (${l.label})`)
          .join('\n');

        const prompt = `
Bạn là chuyên gia dịch thuật và hướng dẫn viên du lịch văn hóa Phật giáo chuyên nghiệp tại Việt Nam Quốc Tự.
Hãy dịch nội dung thuyết minh điểm chiêm bái sau sang các ngôn ngữ:
${langListText}

Nội dung gốc (Tiếng Việt):
- Tiêu đề: ${cleanTitleVi}
- Giới thiệu ngắn: ${cleanIntroVi}
- Thuyết minh chi tiết: ${cleanDescVi}

YÊU CẦU CHẤT LƯỢNG NGHIÊM NGẶT:
1. Văn phong tự nhiên, truyền cảm, trang trọng như lời hướng dẫn viên du lịch chuyên nghiệp.
2. TUYỆT ĐỐI KHÔNG dùng ký tự đặc biệt (*, #, _, ~, [], emoji, markdown) trong bất kỳ trường nào để TTS không bị vấp.
3. Viết các con số quan trọng thành chữ hoặc cách đọc tự nhiên theo từng ngôn ngữ (ví dụ: 13 tầng -> mười ba tầng / thirteen-story; 63m -> sáu mươi ba mét / sixty-three meters).
4. Giữ nguyên hoặc phiên âm chuẩn mực tên riêng Phật giáo và địa danh (ví dụ: Việt Nam Quốc Tự, Bảo Tháp Đa Bảo, Đại Hùng Bửu Điện).
`;

        const response = await withRetry(
          () =>
            this.ai!.models.generateContent({
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
                        description: 'Target language code from the prompt list (e.g. en, ko, ja, zh-CN, fr, de, es, th, id, ru, hi, it)',
                      },
                      title: {
                        type: Type.STRING,
                        description: 'Translated title without special characters',
                      },
                      introduction: {
                        type: Type.STRING,
                        description: '1-2 sentence overview summary without special characters',
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
            }),
          2,
          1000
        );

        const jsonStr = (response.text || '[]').trim();
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
          aiGeneratedItems = parsed;
        }
      } catch (err: any) {
        batchAiError = err?.message || 'Lỗi kết nối Gemini API';
        console.warn('[LocalizationService] Gemini batch translation failed after retries:', batchAiError);
      }
    }

    // Process each target language with concurrency limit = 3 for TTS audio generation
    await mapWithConcurrency(TARGET_TRANSLATION_LANGUAGES, 3, async (cfg) => {
      const existing = existingPoi?.translations[cfg.code];

      // Protect manually edited translations
      if (!forceOverwriteManual && existing?.is_manually_edited) {
        translationsMap[cfg.code] = existing;
        languageStatuses.push({
          lang: cfg.code,
          label: cfg.label,
          status: 'skipped_manual',
          audioGenerated: Boolean(existing.audio_url),
        });
        return;
      }

      const aiItem = aiGeneratedItems.find((item) => {
        const c = (item.lang || '').toLowerCase();
        return c === cfg.code.toLowerCase() || c === cfg.geminiCode.toLowerCase();
      });

      if (!aiItem && this.ai) {
        const reason = batchAiError || `Gemini không trả về bản dịch hợp lệ cho [${cfg.code}]`;
        failedLanguages.push({ lang: cfg.code, error: reason });
        languageStatuses.push({
          lang: cfg.code,
          label: cfg.label,
          status: 'failed',
          audioGenerated: false,
          error: reason,
        });
        return;
      }

      const title = aiItem ? this.cleanTextForTTS(aiItem.title) : `${cleanTitleVi} (${cfg.code.toUpperCase()})`;
      const introduction = aiItem ? this.cleanTextForTTS(aiItem.introduction) : cleanIntroVi;
      const description = aiItem ? this.cleanTextForTTS(aiItem.description) : cleanDescVi;

      const transRecord: POITranslation = {
        translation_id: `trans-${poiId}-${cfg.code}`,
        poi_id: poiId,
        language_code: cfg.code,
        title,
        introduction,
        description,
        audio_url: `/audio/${poiId}-${cfg.ttsCode}.mp3`,
        is_ai_generated: true,
        is_manually_edited: false,
        updated_at: new Date().toISOString(),
      };

      db.saveTranslation(transRecord);
      translationsMap[cfg.code] = transRecord;

      let audioOk = false;
      let audioErr: string | undefined;
      if (generateAudio) {
        try {
          const fullScript = [title, introduction, description].filter(Boolean).join('. ');
          const synth = await withRetry(
            () =>
              ttsService.synthesizeSpeech({
                text: fullScript,
                poiId,
                lang: cfg.ttsCode,
                forceRegenerate: true,
              }),
            1,
            800
          );
          audioOk = Boolean(synth.success);
          if (audioOk) {
            audioGeneratedCount++;
            transRecord.audio_url = synth.audioUrl || transRecord.audio_url;
            db.saveTranslation(transRecord);
          } else {
            audioErr = synth.message || 'TTS fallback sang thiết bị';
          }
        } catch (e: any) {
          audioErr = e?.message || 'Lỗi tạo audio';
        }
      }

      languageStatuses.push({
        lang: cfg.code,
        label: cfg.label,
        status: 'success',
        audioGenerated: audioOk,
        error: audioErr,
      });
    });

    const successCount = languageStatuses.filter((s) => s.status !== 'failed').length;

    return {
      success: true,
      poiId,
      totalLanguages: Object.keys(translationsMap).length,
      translations: translationsMap,
      audioGeneratedCount,
      languageStatuses,
      failedLanguages,
      message:
        failedLanguages.length > 0
          ? `Hoàn tất ${successCount}/${SUPPORTED_LANGUAGES.length} ngôn ngữ (${audioGeneratedCount} file MP3). Có ${failedLanguages.length} ngôn ngữ gặp lỗi.`
          : `Đã tạo thành công ${Object.keys(translationsMap).length}/${SUPPORTED_LANGUAGES.length} ngôn ngữ và ${audioGeneratedCount} file Audio MP3.`,
    };
  }
}

export const localizationService = new LocalizationService();
