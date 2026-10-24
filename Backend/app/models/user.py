from typing import Optional, List
from pydantic import BaseModel

class UserRegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str
    dharma_name: Optional[str] = "Chưa có pháp danh"
    phone: Optional[str] = ""

class UserLoginRequest(BaseModel):
    username: str
    password: str

class UserWishRequest(BaseModel):
    wish: str

class SyncVisitedRequest(BaseModel):
    visited_poi_ids: List[str]

class UserProfileResponse(BaseModel):
    user_id: str
    username: str
    full_name: str
    dharma_name: str
    phone: Optional[str] = ""
    visited_pois: List[str] = []
    wishes: List[str] = []
    created_at: Optional[str] = None
