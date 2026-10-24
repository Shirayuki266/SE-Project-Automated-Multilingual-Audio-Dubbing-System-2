from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from app.core.security import get_current_admin
from app.db.mongo import get_db
from app.models.campus import CampusCreate, CampusUpdate, CampusResponse

router = APIRouter(prefix="/campuses", tags=["Campuses"])

@router.get("/{campus_slug}", response_model=CampusResponse)
async def get_campus(campus_slug: str):
    db = get_db()
    campus = await db["campuses"].find_one({"campus_id": campus_slug})
    if not campus:
        # Fallback to default
        campus = await db["campuses"].find_one({"campus_id": "viet-nam-quoc-tu"})
    if not campus:
        raise HTTPException(status_code=404, detail="Khuôn viên không tồn tại")
    return campus

@router.put("/{campus_slug}", response_model=CampusResponse)
async def update_campus(
    campus_slug: str,
    update_data: CampusUpdate,
    current_admin: dict = Depends(get_current_admin)
):
    db = get_db()
    existing = await db["campuses"].find_one({"campus_id": campus_slug})
    if not existing:
        raise HTTPException(status_code=404, detail="Khuôn viên không tồn tại")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db["campuses"].update_one(
        {"campus_id": campus_slug},
        {"$set": update_dict}
    )
    
    updated = await db["campuses"].find_one({"campus_id": campus_slug})
    return updated
