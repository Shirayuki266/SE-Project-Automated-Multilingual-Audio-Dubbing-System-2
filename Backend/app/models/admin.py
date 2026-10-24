from typing import Optional
from pydantic import BaseModel

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class AdminUser(BaseModel):
    user_id: str
    username: str
    password_hash: str
    full_name: str
    role: str = "admin"
    created_at: Optional[str] = None
