import asyncio
from app.db.mongo import db_manager
from app.db.seed import seed_data
from app.services.image_generator import generate_all_temple_images

async def run_test():
    print("Testing db connection...")
    await db_manager.connect()
    print(f"Connected. is_live_mongo={db_manager.is_live_mongo}")
    print("Generating temple images...")
    generate_all_temple_images()
    print("Seeding database...")
    await seed_data()
    pois_count = await db_manager.db["pois"].count_documents()
    print(f"Success! Total POIs in database: {pois_count}")
    await db_manager.close()

if __name__ == "__main__":
    asyncio.run(run_test())
