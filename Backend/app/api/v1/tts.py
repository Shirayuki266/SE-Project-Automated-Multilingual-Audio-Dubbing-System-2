from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from app.services.tts_service import tts_service

router = APIRouter(prefix="/tts", tags=["Text-to-Speech"])

class SynthesizeRequest(BaseModel):
    text: str
    language: str = "vi"  # 'vi' or 'en'
    filename: str = None

@router.post("/synthesize")
async def synthesize_speech(req: SynthesizeRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Văn bản không được để trống")
    
    audio_url = await tts_service.synthesize(
        text=req.text,
        language=req.language,
        filename=req.filename
    )
    return {
        "status": "success",
        "audio_url": audio_url,
        "language": req.language
    }
