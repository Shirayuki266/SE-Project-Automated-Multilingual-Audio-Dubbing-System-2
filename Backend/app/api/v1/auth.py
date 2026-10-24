from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, HTTPException, status, Depends
from app.core.security import (
    verify_password,
    hash_password,
    create_access_token,
    get_current_admin,
    security_scheme,
    decode_access_token,
)
from app.db.mongo import get_db
from app.models.admin import LoginRequest, TokenResponse
from app.models.user import (
    UserRegisterRequest,
    UserLoginRequest,
    UserProfileResponse,
    UserWishRequest,
    SyncVisitedRequest,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

async def get_current_user_payload(credentials = Depends(security_scheme)) -> dict:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Yêu cầu đăng nhập tài khoản",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên đăng nhập đã hết hạn hoặc không hợp lệ",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

# ==================== ADMIN AUTH ====================

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    db = get_db()
    admin = await db["admin_users"].find_one({"username": req.username})
    if not admin or not verify_password(req.password, admin.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sai tài khoản hoặc mật khẩu quản trị"
        )
    
    now_str = datetime.now(timezone.utc).isoformat()
    await db["admin_users"].update_one(
        {"username": req.username},
        {"$set": {"last_login": now_str}}
    )
    
    token = create_access_token({
        "sub": admin["username"],
        "user_id": admin.get("user_id", "admin"),
        "role": admin.get("role", "admin"),
        "full_name": admin.get("full_name", "Quản trị viên")
    })
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user={
            "user_id": admin.get("user_id", "admin"),
            "username": admin["username"],
            "full_name": admin.get("full_name", "Ban Quản Trị"),
            "role": admin.get("role", "admin")
        }
    )

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_admin)):
    return {
        "status": "success",
        "user": current_user
    }

# ==================== END-USER / PHẬT TỬ AUTH ====================

@router.post("/user/register", response_model=TokenResponse)
async def user_register(req: UserRegisterRequest):
    db = get_db()
    existing = await db["users"].find_one({"username": req.username.strip()})
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Tên tài khoản này đã được sử dụng. Vui lòng chọn tên khác."
        )

    user_id = f"usr_{uuid.uuid4().hex[:8]}"
    now_str = datetime.now(timezone.utc).isoformat()
    user_doc = {
        "user_id": user_id,
        "username": req.username.strip(),
        "password_hash": hash_password(req.password),
        "full_name": req.full_name.strip(),
        "dharma_name": req.dharma_name.strip() if req.dharma_name else "Chưa có pháp danh",
        "phone": req.phone.strip() if req.phone else "",
        "role": "user",
        "visited_pois": [],
        "wishes": [],
        "created_at": now_str,
        "last_login": now_str,
    }
    await db["users"].insert_one(user_doc)

    token = create_access_token({
        "sub": user_doc["username"],
        "user_id": user_id,
        "role": "user",
        "full_name": user_doc["full_name"],
        "dharma_name": user_doc["dharma_name"],
    })

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user={
            "user_id": user_id,
            "username": user_doc["username"],
            "full_name": user_doc["full_name"],
            "dharma_name": user_doc["dharma_name"],
            "phone": user_doc["phone"],
            "role": "user",
            "visited_pois": [],
            "wishes": [],
        }
    )

@router.post("/user/login", response_model=TokenResponse)
async def user_login(req: UserLoginRequest):
    db = get_db()
    user = await db["users"].find_one({"username": req.username.strip()})
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tên đăng nhập hoặc mật khẩu không chính xác"
        )

    now_str = datetime.now(timezone.utc).isoformat()
    await db["users"].update_one(
        {"username": user["username"]},
        {"$set": {"last_login": now_str}}
    )

    token = create_access_token({
        "sub": user["username"],
        "user_id": user.get("user_id"),
        "role": "user",
        "full_name": user.get("full_name"),
        "dharma_name": user.get("dharma_name", ""),
    })

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user={
            "user_id": user.get("user_id"),
            "username": user["username"],
            "full_name": user.get("full_name"),
            "dharma_name": user.get("dharma_name", "Chưa có pháp danh"),
            "phone": user.get("phone", ""),
            "role": "user",
            "visited_pois": user.get("visited_pois", []),
            "wishes": user.get("wishes", []),
        }
    )

@router.get("/user/me", response_model=UserProfileResponse)
async def get_user_profile(payload: dict = Depends(get_current_user_payload)):
    db = get_db()
    user = await db["users"].find_one({"username": payload.get("sub")})
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông tin tài khoản")
    return user

@router.post("/user/sync-visited")
async def sync_user_visited(req: SyncVisitedRequest, payload: dict = Depends(get_current_user_payload)):
    db = get_db()
    username = payload.get("sub")
    user = await db["users"].find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
    
    current_visited = set(user.get("visited_pois", []))
    current_visited.update(req.visited_poi_ids)
    merged = list(current_visited)

    await db["users"].update_one(
        {"username": username},
        {"$set": {"visited_pois": merged}}
    )
    return {"status": "success", "visited_pois": merged}

@router.post("/user/wish")
async def add_user_wish(req: UserWishRequest, payload: dict = Depends(get_current_user_payload)):
    if not req.wish.strip():
        raise HTTPException(status_code=400, detail="Lời nguyện không được để trống")
    db = get_db()
    username = payload.get("sub")
    user = await db["users"].find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
    
    wishes = user.get("wishes", [])
    now_str = datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M")
    wishes.insert(0, f"[{now_str}] {req.wish.strip()}")

    await db["users"].update_one(
        {"username": username},
        {"$set": {"wishes": wishes}}
    )
    return {"status": "success", "wishes": wishes}
