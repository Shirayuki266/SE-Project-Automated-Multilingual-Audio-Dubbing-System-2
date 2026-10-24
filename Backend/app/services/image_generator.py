import os
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
from app.core.config import settings

def get_vietnamese_font(size: int, bold: bool = False):
    """
    Load a Vietnamese-compatible TrueType font on Windows, with graceful fallbacks.
    """
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/tahoma.ttf",
        "C:/Windows/Fonts/calibri.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size=size)
            except Exception:
                pass
    return ImageFont.load_default()

def create_temple_placeholder(filename: str, title: str, subtitle: str, bg_gradient_colors: tuple):
    filepath = settings.IMAGES_DIR / filename
    
    width, height = 800, 500
    img = Image.new("RGB", (width, height), bg_gradient_colors[0])
    draw = ImageDraw.Draw(img)
    
    # Draw subtle gradient
    r1, g1, b1 = bg_gradient_colors[0]
    r2, g2, b2 = bg_gradient_colors[1]
    for y in range(height):
        factor = y / height
        r = int(r1 + (r2 - r1) * factor)
        g = int(g1 + (g2 - g1) * factor)
        b = int(b1 + (b2 - b1) * factor)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # Draw Buddhist decorative framing
    draw.rectangle([20, 20, width - 20, height - 20], outline="#d4af37", width=3)
    draw.rectangle([28, 28, width - 28, height - 28], outline="#8c6d2d", width=1)
    
    # Draw central lotus emblem symbol
    cx, cy = width // 2, height // 2 - 45
    draw.ellipse([cx - 50, cy - 50, cx + 50, cy + 50], outline="#d4af37", width=2)
    draw.polygon([(cx, cy - 40), (cx + 25, cy + 10), (cx, cy + 30), (cx - 25, cy + 10)], outline="#d4af37", width=2)
    
    font_brand = get_vietnamese_font(26, bold=True)
    font_title = get_vietnamese_font(30, bold=True)
    font_sub = get_vietnamese_font(18, bold=False)

    # Draw text banners with full Vietnamese TrueType font support
    draw.text((width // 2, cy + 85), "VIỆT NAM QUỐC TỰ", fill="#ffd700", font=font_brand, anchor="mm")
    draw.text((width // 2, cy + 130), title, fill="#ffffff", font=font_title, anchor="mm")
    draw.text((width // 2, cy + 175), subtitle, fill="#f3deb0", font=font_sub, anchor="mm")
    
    img.save(filepath, "JPEG", quality=92)

def generate_all_temple_images():
    images = [
        ("vietnam_quoc_tu_overview.jpg", "QUẦN THỂ DI TÍCH TÂM LINH", "244 Ba Tháng Hai, Quận 10, TP. Hồ Chí Minh", ((60, 25, 15), (25, 10, 5))),
        ("tam_quan.jpg", "CỔNG TAM QUAN", "Tam Giải Thoát Môn • Lối Vào Thiền Môn", ((80, 35, 20), (35, 15, 10))),
        ("bao_thap.jpg", "BẢO THÁP 13 TẦNG (63M)", "Tôn Thờ Xá Lợi Trái Tim Bất Diệt Bồ Tát Thích Quảng Đức", ((95, 40, 25), (40, 18, 10))),
        ("chanh_dien.jpg", "TÒA ĐẠI CHÁNH ĐIỆN", "Đại Tượng Phật Bổn Sư Bằng Đồng 35 Tấn Kỷ Lục", ((100, 45, 20), (45, 20, 10))),
        ("thap_chuong.jpg", "THÁP CHUÔNG ĐẠI HỒNG CHUNG", "Quả Chuông Đồng Gần 3 Tấn Âm Vang Thức Tỉnh", ((75, 45, 25), (35, 20, 10))),
        ("nha_to.jpg", "NHÀ TỔ TRUYỀN THỐNG", "Tri Ân Chư Vị Tiền Bối Thánh Tăng Hữu Công", ((85, 38, 22), (38, 16, 10))),
        ("phong_trung_bay.jpg", "PHÒNG TRƯNG BÀY VĂN HÓA", "Bảo Vật & Kỷ Vật Phong Trào Phật Giáo 1963", ((70, 30, 25), (30, 12, 12))),
        ("vuon_lam_ty_ni.jpg", "VƯỜN LÂM TỲ NI & HỒ SEN", "Bảy Bước Hoa Sen Nâng Gót Ngọc Thái Tử Tất Đạt Đa", ((55, 60, 35), (20, 30, 18))),
    ]
    for filename, title, sub, colors in images:
        create_temple_placeholder(filename, title, sub, colors)
