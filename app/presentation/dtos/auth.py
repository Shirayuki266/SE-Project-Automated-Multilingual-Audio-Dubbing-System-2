from typing import Literal

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    login: str = Field(min_length=1, max_length=320)
    password: str = Field(min_length=1, max_length=128)


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int


class AdminRead(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: str
