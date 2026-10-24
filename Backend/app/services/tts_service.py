import asyncio
import logging
from pathlib import Path
import edge_tts
from app.core.config import settings

logger = logging.getLogger("uvicorn")

def clean_ssml_text(text: str, language: str) -> str:
    """
    Sanitize text for Edge-TTS / SSML to prevent XML parse errors.
    """
    # Replace & with 'và' or 'and'
    if language == "vi":
        text = text.replace("&", " và ")
    else:
        text = text.replace("&", " and ")
    
    # Replace special dashes and quotes that can break SSML
    text = text.replace("–", "-").replace("—", "-")
    text = text.replace("“", '"').replace("”", '"')
    text = text.replace("‘", "'").replace("’", "'")
    return text.strip()

class TTSService:
    @staticmethod
    async def synthesize(text: str, language: str = "vi", filename: str = None) -> str:
        """
        Synthesize speech using Microsoft Edge-TTS with retry, text sanitization, and fallback.
        language: 'vi' or 'en'
        """
        if not text:
            return ""

        text = clean_ssml_text(text, language)

        if not filename:
            import hashlib
            file_hash = hashlib.md5(f"{language}_{text[:50]}".encode('utf-8')).hexdigest()[:12]
            filename = f"tts_{language}_{file_hash}.mp3"

        if not filename.endswith(".mp3"):
            filename += ".mp3"

        out_path = settings.AUDIO_DIR / filename
        
        # If file already exists and is greater than 5KB (not placeholder), reuse it
        if out_path.exists() and out_path.stat().st_size > 5000:
            return f"/static/audio/{filename}"

        # Select natural neural voices
        voice = settings.TTS_VOICE_VI if language == "vi" else settings.TTS_VOICE_EN
        
        # Retry up to 3 times with backoff
        for attempt in range(3):
            try:
                logger.info(f"Synthesizing speech with Edge-TTS (attempt {attempt+1}) voice={voice} to {filename}...")
                communicate = edge_tts.Communicate(text=text, voice=voice)
                await communicate.save(str(out_path))
                if out_path.exists() and out_path.stat().st_size > 5000:
                    logger.info(f"Edge-TTS synthesized successfully: {out_path.stat().st_size} bytes")
                    return f"/static/audio/{filename}"
            except Exception as e:
                logger.warning(f"Edge-TTS attempt {attempt+1} failed for {filename}: {e}")
                await asyncio.sleep(1.0 * (attempt + 1))

        # If network/server error after 3 attempts, create fallback audio frame
        if not out_path.exists() or out_path.stat().st_size < 1000:
            with open(out_path, "wb") as f:
                f.write(b'\xff\xfb\x90\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00' * 50)
        return f"/static/audio/{filename}"

tts_service = TTSService()
