import json
from app.services.image_generator import generate_all_temple_images
from app.services.qr_service import qr_service

print("Regenerating temple images with TrueType Vietnamese fonts...")
generate_all_temple_images()

print("Regenerating QR plaques with TrueType Vietnamese fonts...")
with open("data/pois.json", "r", encoding="utf-8") as f:
    pois = json.load(f)

for p in pois:
    deep_link = f"http://localhost:5173/?poi={p['poi_id']}"
    title_vi = p["translations"]["vi"]["title"]
    qr_url = qr_service.save_poi_qr(p["poi_id"], deep_link, title_vi)

print("Regeneration complete!")
