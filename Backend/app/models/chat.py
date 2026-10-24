from typing import Optional, List
from pydantic import BaseModel

class ChatMessage(BaseModel):
    role: str  # 'user' | 'assistant'
    content: str

class ChatRequest(BaseModel):
    message: str
    language: str = "vi"  # 'vi' | 'en'
    current_poi_id: Optional[str] = None
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    reply: str
    suggested_questions: List[str] = []
