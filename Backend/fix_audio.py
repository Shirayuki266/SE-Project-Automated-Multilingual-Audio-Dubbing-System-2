import asyncio
from app.db.seed import SAMPLE_POIS
from app.services.tts_service import tts_service

async def main():
    print("Checking and synthesizing full audio for all POIs...")
    for p in SAMPLE_POIS:
        for lang in ["vi", "en"]:
            trans = p["translations"][lang]
            text = f"{trans['title']}. {trans['description']}"
            fn = f"{p['poi_id']}_{lang}.mp3"
            print(f"Processing {fn}...")
            url = await tts_service.synthesize(text, lang, fn)
            print(f"Done: {url}")
            await asyncio.sleep(0.3)
    print("All audio synthesis complete!")

if __name__ == "__main__":
    asyncio.run(main())
