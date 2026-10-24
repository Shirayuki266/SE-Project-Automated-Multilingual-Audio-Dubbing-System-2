from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Response, Query
from app.core.config import settings
from app.core.security import get_current_admin
from app.db.mongo import get_db
from app.models.poi import POICreate, POIUpdate, POIResponse
from app.services.tts_service import tts_service
from app.services.qr_service import qr_service

router = APIRouter(tags=["POIs"])

@router.get("/campuses/{campus_slug}/pois", response_model=List[POIResponse])
async def get_campus_pois(campus_slug: str):
    """
    Fetch all active POIs for a campus.
    Optimized for Client-Side Caching (Offline-first architecture).
    """
    db = get_db()
    cursor = db["pois"].find({"campus_id": campus_slug}, sort=[("order_index", 1)])
    pois = await cursor.to_list()
    return pois

@router.get("/pois/{poi_id}", response_model=POIResponse)
async def get_poi(poi_id: str):
    db = get_db()
    poi = await db["pois"].find_one({"poi_id": poi_id})
    if not poi:
        # Try finding by code
        poi = await db["pois"].find_one({"code": poi_id})
    if not poi:
        raise HTTPException(status_code=404, detail="Điểm tham quan không tồn tại")
    return poi

@router.post("/pois", response_model=POIResponse)
async def create_poi(poi_in: POICreate, current_admin: dict = Depends(get_current_admin)):
    db = get_db()
    existing = await db["pois"].find_one({"poi_id": poi_in.poi_id})
    if existing:
        raise HTTPException(status_code=400, detail="Mã định danh POI (poi_id) đã tồn tại")
    
    poi_dict = poi_in.model_dump()
    now_str = datetime.now(timezone.utc).isoformat()
    poi_dict["created_at"] = now_str
    poi_dict["updated_at"] = now_str

    # Generate QR Code
    deep_link = f"{settings.FRONTEND_URL}/?poi={poi_in.poi_id}"
    title_vi = poi_in.translations.get("vi", {}).title if poi_in.translations.get("vi") else poi_in.poi_id
    qr_url = qr_service.save_poi_qr(poi_in.poi_id, deep_link, title_vi)
    poi_dict["qr_code_url"] = qr_url

    # Auto synthesize TTS if missing
    for lang in ["vi", "en"]:
        trans = poi_dict.get("translations", {}).get(lang)
        if trans and trans.get("description") and not trans.get("audio_url"):
            audio_url = await tts_service.synthesize(
                text=trans["description"],
                language=lang,
                filename=f"{poi_in.poi_id}_{lang}.mp3"
            )
            trans["audio_url"] = audio_url

    await db["pois"].insert_one(poi_dict)
    return poi_dict

@router.put("/pois/{poi_id}", response_model=POIResponse)
async def update_poi(poi_id: str, poi_update: POIUpdate, current_admin: dict = Depends(get_current_admin)):
    db = get_db()
    existing = await db["pois"].find_one({"poi_id": poi_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Điểm tham quan không tồn tại")
    
    update_dict = {k: v for k, v in poi_update.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # If translations updated, update QR code title
    if "translations" in update_dict:
        deep_link = f"{settings.FRONTEND_URL}/?poi={poi_id}"
        title_vi = update_dict["translations"].get("vi", {}).get("title", poi_id)
        qr_url = qr_service.save_poi_qr(poi_id, deep_link, title_vi)
        update_dict["qr_code_url"] = qr_url

    await db["pois"].update_one({"poi_id": poi_id}, {"$set": update_dict})
    updated = await db["pois"].find_one({"poi_id": poi_id})
    return updated

@router.delete("/pois/{poi_id}")
async def delete_poi(poi_id: str, current_admin: dict = Depends(get_current_admin)):
    db = get_db()
    existing = await db["pois"].find_one({"poi_id": poi_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Điểm tham quan không tồn tại")
    
    await db["pois"].delete_one({"poi_id": poi_id})
    return {"status": "success", "message": f"Đã xóa điểm tham quan {poi_id}"}

@router.post("/pois/{poi_id}/tts")
async def generate_poi_tts(
    poi_id: str,
    language: Optional[str] = Query(None, description="vi or en or None for both"),
    current_admin: dict = Depends(get_current_admin)
):
    """
    Generate or regenerate Edge-TTS neural speech audio for this POI.
    """
    db = get_db()
    poi = await db["pois"].find_one({"poi_id": poi_id})
    if not poi:
        raise HTTPException(status_code=404, detail="Điểm tham quan không tồn tại")
    
    translations = poi.get("translations", {})
    langs_to_process = [language] if language in ["vi", "en"] else ["vi", "en"]
    results = {}

    for lang in langs_to_process:
        trans = translations.get(lang)
        if trans and trans.get("description"):
            text = f"{trans.get('title')}. {trans.get('description')}"
            filename = f"{poi_id}_{lang}.mp3"
            audio_url = await tts_service.synthesize(text=text, language=lang, filename=filename)
            trans["audio_url"] = audio_url
            results[lang] = audio_url

    await db["pois"].update_one(
        {"poi_id": poi_id},
        {"$set": {"translations": translations, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "success", "poi_id": poi_id, "audio_urls": results}

@router.get("/pois/{poi_id}/qr")
async def export_poi_qr(poi_id: str, format: str = Query("png", pattern="^(png|svg)$")):
    """
    Download QR code for physical plaque in PNG or SVG vector format (UC11).
    """
    db = get_db()
    poi = await db["pois"].find_one({"poi_id": poi_id})
    if not poi:
        raise HTTPException(status_code=404, detail="Điểm tham quan không tồn tại")
    
    deep_link = f"{settings.FRONTEND_URL}/?poi={poi_id}"
    title_vi = poi.get("translations", {}).get("vi", {}).get("title", poi_id)

    if format == "svg":
        svg_content = qr_service.generate_qr_svg(deep_link)
        return Response(
            content=svg_content,
            media_type="image/svg+xml",
            headers={"Content-Disposition": f'attachment; filename="qr_{poi_id}.svg"'}
        )
    else:
        png_content = qr_service.generate_qr_png(deep_link, title_vi)
        return Response(
            content=png_content,
            media_type="image/png",
            headers={"Content-Disposition": f'attachment; filename="qr_{poi_id}.png"'}
        )

@router.get("/pois/qr/batch-zip")
async def export_all_qrs_zip(current_admin: dict = Depends(get_current_admin)):
    """
    Download a ZIP file containing PNG and SVG QR codes for all POIs (UC11 A1).
    """
    db = get_db()
    cursor = db["pois"].find({"campus_id": "viet-nam-quoc-tu"})
    pois = await cursor.to_list()
    zip_bytes = qr_service.create_batch_zip(pois, settings.FRONTEND_URL)
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="vietnam_quoc_tu_qr_plaques.zip"'}
    )
