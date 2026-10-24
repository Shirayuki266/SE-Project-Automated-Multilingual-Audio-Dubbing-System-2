from fastapi import APIRouter
from app.models.chat import ChatRequest, ChatResponse
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/chat", tags=["Buddhist AI Assistant"])

@router.post("", response_model=ChatResponse)
async def chat_with_assistant(req: ChatRequest):
    result = await gemini_service.chat(
        message=req.message,
        language=req.language,
        current_poi_id=req.current_poi_id,
        history=req.history
    )
    return ChatResponse(
        reply=result["reply"],
        suggested_questions=result.get("suggested_questions", [])
    )
