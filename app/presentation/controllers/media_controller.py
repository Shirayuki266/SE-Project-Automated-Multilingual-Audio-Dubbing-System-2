from typing import Literal

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    Header,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.business_logic.services import audio_stream_service, content_service, media_service
from app.business_logic.services.audio_stream_service import InvalidByteRange
from app.business_logic.services.media_service import MediaValidationError
from app.config import Settings
from app.data_access.database import get_app_settings, get_db
from app.data_access.entities.models import AdminUser
from app.presentation.dtos.content import MediaRead
from app.presentation.middlewares.auth import get_current_admin


router = APIRouter(tags=["Media"])


@router.post(
    "/admin/pois/{poi_id}/media",
    response_model=MediaRead,
    status_code=status.HTTP_201_CREATED,
)
async def upload_poi_media(
    poi_id: str,
    media_type: Literal["IMAGE", "AUDIO_VI", "AUDIO_EN"] = Form(),
    file: UploadFile = File(),
    session: Session = Depends(get_db),
    settings: Settings = Depends(get_app_settings),
    _: AdminUser = Depends(get_current_admin),
) -> MediaRead:
    try:
        campus = content_service.require_campus(session)
        content = await file.read(20 * 1024 * 1024 + 1)
        media = media_service.save_poi_media(
            session,
            settings,
            campus,
            poi_id,
            filename=file.filename or "",
            media_type=media_type,
            content=content,
        )
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except MediaValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return media


@router.get("/media/audio/{media_id}")
def stream_audio(
    media_id: str,
    range_header: str | None = Header(default=None, alias="Range"),
    session: Session = Depends(get_db),
    settings: Settings = Depends(get_app_settings),
) -> Response:
    media = media_service.get_poi_media(session, media_id)
    if (
        media is None
        or not media.media_type.startswith("AUDIO_")
        or not media.poi.is_active
        or media.poi.is_deleted
    ):
        raise HTTPException(status_code=404, detail="Không tìm thấy tệp audio")
    try:
        path = media_service.resolve_media_path(settings, media.storage_key)
    except ValueError as error:
        raise HTTPException(status_code=500, detail="Đường dẫn media không hợp lệ") from error
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Tệp audio không tồn tại")

    file_size = path.stat().st_size
    headers = {
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
    }
    if range_header is None:
        headers["Content-Length"] = str(file_size)
        return FileResponse(path, media_type="audio/mpeg", headers=headers)
    try:
        start, end = audio_stream_service.parse_byte_range(range_header, file_size)
    except InvalidByteRange as error:
        raise HTTPException(
            status_code=416,
            detail=str(error),
            headers={"Content-Range": f"bytes */{file_size}"},
        ) from error
    length = end - start + 1
    headers.update(
        {
            "Content-Length": str(length),
            "Content-Range": f"bytes {start}-{end}/{file_size}",
        }
    )
    return StreamingResponse(
        audio_stream_service.stream_file_range(path, start, length),
        status_code=status.HTTP_206_PARTIAL_CONTENT,
        media_type="audio/mpeg",
        headers=headers,
    )


@router.get("/media/files/{media_id}")
def get_media_file(
    media_id: str,
    session: Session = Depends(get_db),
    settings: Settings = Depends(get_app_settings),
) -> FileResponse:
    media = media_service.get_poi_media(session, media_id)
    if (
        media is None
        or media.media_type != "IMAGE"
        or not media.poi.is_active
        or media.poi.is_deleted
    ):
        raise HTTPException(status_code=404, detail="Không tìm thấy tệp media")
    try:
        path = media_service.resolve_media_path(settings, media.storage_key)
    except ValueError as error:
        raise HTTPException(status_code=500, detail="Đường dẫn media không hợp lệ") from error
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Tệp media không tồn tại")
    return FileResponse(path, headers={"Cache-Control": "public, max-age=86400"})


@router.get("/admin/pois/{poi_id}/qrcode")
def export_poi_qr_code(
    poi_id: str,
    output_format: Literal["svg", "png"] = "svg",
    session: Session = Depends(get_db),
    settings: Settings = Depends(get_app_settings),
    _: AdminUser = Depends(get_current_admin),
) -> Response:
    try:
        poi = content_service.get_public_poi(session, poi_id)
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    payload = f"{settings.public_base_url.rstrip('/')}/poi/{poi.id}"
    content, media_type = media_service.create_qr_code(payload, output_format)
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="poi-{poi.id}.{output_format}"'},
    )
