import io
import os
import zipfile
import qrcode
import qrcode.image.svg
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
from typing import Dict, Any, List
from app.core.config import settings

def get_vietnamese_font(size: int = 15):
    candidates = [
        "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/tahoma.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size=size)
            except Exception:
                pass
    return ImageFont.load_default()

class QRService:
    @staticmethod
    def generate_qr_png(data: str, title: str = "") -> bytes:
        """
        Generate a high-res PNG QR code with elegant temple-style styling and text label.
        """
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=12,
            border=3,
        )
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#5c2b16", back_color="#fffcf5").convert("RGB")
        
        # Add a title footer banner if title provided
        if title:
            banner_height = 52
            new_img = Image.new("RGB", (img.width, img.height + banner_height), "#fffcf5")
            new_img.paste(img, (0, 0))
            
            draw = ImageDraw.Draw(new_img)
            # Draw decorative border
            draw.rectangle([6, 6, new_img.width - 6, new_img.height - 6], outline="#d4af37", width=2)
            
            # Text rendering with TrueType font supporting Vietnamese
            font = get_vietnamese_font(15)
            text = f"Việt Nam Quốc Tự • {title[:28]}"
            draw.text((new_img.width // 2, img.height + 15), text, fill="#5c2b16", font=font, anchor="mt")
            img = new_img

        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        return buffer.getvalue()

    @staticmethod
    def generate_qr_svg(data: str) -> str:
        """
        Generate SVG vector QR code.
        """
        factory = qrcode.image.svg.SvgPathImage
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=2,
            image_factory=factory
        )
        qr.add_data(data)
        qr.make(fit=True)
        svg_img = qr.make_image(fill_color="#5c2b16")
        
        buffer = io.BytesIO()
        svg_img.save(buffer)
        return buffer.getvalue().decode("utf-8")

    @staticmethod
    def save_poi_qr(poi_id: str, deep_link: str, title: str = "") -> str:
        """
        Save PNG QR code file to static/qr/{poi_id}.png and return public URL.
        """
        png_bytes = QRService.generate_qr_png(deep_link, title)
        filename = f"qr_{poi_id}.png"
        filepath = settings.QR_DIR / filename
        with open(filepath, "wb") as f:
            f.write(png_bytes)
        return f"/static/qr/{filename}"

    @staticmethod
    def create_batch_zip(pois: List[Dict[str, Any]], base_url: str) -> bytes:
        """
        Create a ZIP file containing PNG and SVG QR codes for all POIs.
        """
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for poi in pois:
                poi_id = poi.get("poi_id", "poi")
                title_vi = poi.get("translations", {}).get("vi", {}).get("title", poi_id)
                deep_link = f"{base_url}/?poi={poi_id}"
                
                # PNG
                png_data = QRService.generate_qr_png(deep_link, title_vi)
                zip_file.writestr(f"vietnam_quoc_tu_qr/PNG/{poi_id}_{title_vi}.png", png_data)
                
                # SVG
                svg_data = QRService.generate_qr_svg(deep_link)
                zip_file.writestr(f"vietnam_quoc_tu_qr/SVG/{poi_id}_{title_vi}.svg", svg_data)
                
        return zip_buffer.getvalue()

qr_service = QRService()
