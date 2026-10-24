from io import BytesIO
from pathlib import Path
from uuid import uuid4

import qrcode
from mutagen import MutagenError
from mutagen.mp3 import MP3
from PIL import Image, UnidentifiedImageError
from qrcode.image.svg import SvgPathImage
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.config import Settings
from app.data_access.entities.models import Campus, POIMedia
from app.data_access.repositories import content_repository


IMAGE_LIMIT = 5 * 1024 * 1024
AUDIO_LIMIT = 20 * 1024 * 1024
SUPPORTED_IMAGES = {
    ".jpg": ("JPEG", "image/jpeg"),
    ".jpeg": ("JPEG", "image/jpeg"),
    ".png": ("PNG", "image/png"),
    ".webp": ("WEBP", "image/webp"),
}


class MediaValidationError(ValueError):
    pass


def get_poi_media(session: Session, media_id: str) -> POIMedia | None:
    return content_repository.get_media(session, media_id)


def _validate_image(filename: str, content: bytes) -> tuple[str, str]:
    suffix = Path(filename).suffix.lower()
    expected = SUPPORTED_IMAGES.get(suffix)
    if expected is None:
        raise MediaValidationError("Ảnh phải có định dạng JPG, PNG hoặc WebP")
    if len(content) > IMAGE_LIMIT:
        raise MediaValidationError("Kích thước ảnh không được vượt quá 5 MB")
    try:
        with Image.open(BytesIO(content)) as image:
            if image.format != expected[0]:
                raise MediaValidationError("Định dạng ảnh không khớp với phần mở rộng tệp")
            if image.width * image.height > 50_000_000:
                raise MediaValidationError("Kích thước ảnh vượt giới hạn xử lý an toàn")
            image.verify()
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError) as error:
        raise MediaValidationError("Tệp ảnh không hợp lệ") from error
    return suffix, expected[1]


def _compress_image(content: bytes, suffix: str) -> bytes:
    with Image.open(BytesIO(content)) as image:
        output = BytesIO()
        if suffix in {".jpg", ".jpeg"}:
            image.save(output, format="JPEG", optimize=True, progressive=True, quality=85)
        elif suffix == ".webp":
            image.save(output, format="WEBP", method=6, quality=85)
        else:
            image.save(output, format="PNG", optimize=True)
    compressed = output.getvalue()
    return compressed if len(compressed) < len(content) else content


def _validate_audio(filename: str, content: bytes) -> tuple[str, str, int, int | None]:
    if Path(filename).suffix.lower() != ".mp3":
        raise MediaValidationError("Tệp thuyết minh phải có định dạng MP3")
    if len(content) > AUDIO_LIMIT:
        raise MediaValidationError("Kích thước tệp audio không được vượt quá 20 MB")
    try:
        audio = MP3(BytesIO(content))
    except (MutagenError, OSError) as error:
        raise MediaValidationError("Không đọc được metadata của tệp MP3") from error
    if audio.info.bitrate is None:
        raise MediaValidationError("Không xác định được bitrate của tệp MP3")
    bitrate = int(audio.info.bitrate)
    if not 128_000 <= bitrate <= 320_000:
        raise MediaValidationError("Bitrate MP3 phải nằm trong khoảng 128–320 kbps")
    duration = round(audio.info.length) if audio.info.length else None
    return ".mp3", "audio/mpeg", bitrate, duration


def save_poi_media(
    session: Session,
    settings: Settings,
    campus: Campus,
    poi_id: str,
    *,
    filename: str,
    media_type: str,
    content: bytes,
) -> POIMedia:
    poi = content_repository.get_poi(session, poi_id)
    if poi is None:
        raise LookupError("Không tìm thấy điểm tham quan")
    media_id = str(uuid4())
    bitrate: int | None = None
    duration: int | None = None

    if media_type == "IMAGE":
        suffix, _ = _validate_image(filename, content)
        content = _compress_image(content, suffix)
        storage_key = f"{media_id}{suffix}"
    elif media_type in {"AUDIO_VI", "AUDIO_EN"}:
        suffix, _, bitrate, duration = _validate_audio(filename, content)
        storage_key = f"audio_{media_type.removeprefix('AUDIO_').lower()}_{media_id}{suffix}"
    else:
        raise MediaValidationError("Loại media không được hỗ trợ")

    storage_path = settings.media_storage_path.resolve()
    storage_path.mkdir(parents=True, exist_ok=True)
    file_path = storage_path / storage_key
    file_path.write_bytes(content)
    media = POIMedia(
        id=media_id,
        poi_id=poi_id,
        media_type=media_type,
        file_url=(
            f"/api/v1/media/audio/{media_id}"
            if media_type.startswith("AUDIO_")
            else f"/api/v1/media/files/{media_id}"
        ),
        storage_key=storage_key,
        file_size=len(content),
        duration_seconds=duration,
        bitrate=bitrate,
    )
    try:
        return content_repository.add_media(session, campus, media)
    except SQLAlchemyError:
        session.rollback()
        file_path.unlink(missing_ok=True)
        raise


def resolve_media_path(settings: Settings, storage_key: str) -> Path:
    root = settings.media_storage_path.resolve()
    path = (root / storage_key).resolve()
    if path.parent != root:
        raise ValueError("Media storage path is invalid")
    return path


def create_qr_code(payload: str, output_format: str) -> tuple[bytes, str]:
    code = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_Q,
        box_size=10,
        border=4,
    )
    code.add_data(payload)
    code.make(fit=True)
    if output_format == "svg":
        image = code.make_image(image_factory=SvgPathImage)
        output = BytesIO()
        image.save(output)
        return output.getvalue(), "image/svg+xml"
    if output_format == "png":
        image = code.make_image(fill_color="black", back_color="white").get_image()
        image = image.resize((1000, 1000), Image.Resampling.NEAREST)
        output = BytesIO()
        image.save(output, format="PNG")
        return output.getvalue(), "image/png"
    raise MediaValidationError("Định dạng QR phải là PNG hoặc SVG")
