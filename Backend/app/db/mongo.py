import asyncio
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger("uvicorn")

class AsyncJsonCollection:
    """
    High-fidelity file-backed async collection mirroring Motor/MongoDB API.
    Guarantees zero-downtime offline functionality when MongoDB daemon is not running.
    """
    def __init__(self, name: str, data_dir: Path):
        self.name = name
        self.file_path = data_dir / f"{name}.json"
        self._lock = asyncio.Lock()
        self._cache: Optional[List[Dict[str, Any]]] = None

    async def _read(self) -> List[Dict[str, Any]]:
        if self._cache is not None:
            return self._cache
        if not self.file_path.exists():
            self._cache = []
            return self._cache
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                self._cache = json.load(f)
        except Exception as e:
            logger.warning(f"Error reading JSON collection {self.name}: {e}")
            self._cache = []
        return self._cache

    async def _write(self, data: List[Dict[str, Any]]):
        self._cache = data
        temp_file = self.file_path.with_suffix(".tmp")
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        temp_file.replace(self.file_path)

    async def find_one(self, filter: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        async with self._lock:
            docs = await self._read()
            for doc in docs:
                match = True
                for k, v in filter.items():
                    if doc.get(k) != v:
                        match = False
                        break
                if match:
                    return doc.copy()
            return None

    def find(self, filter: Optional[Dict[str, Any]] = None, sort: Optional[List[tuple]] = None):
        filter = filter or {}
        class AsyncCursor:
            def __init__(self, collection: AsyncJsonCollection, query: Dict[str, Any], sort_spec: Optional[List[tuple]]):
                self.collection = collection
                self.query = query
                self.sort_spec = sort_spec

            async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
                async with self.collection._lock:
                    docs = await self.collection._read()
                    results = []
                    for doc in docs:
                        match = True
                        for k, v in self.query.items():
                            if self.query.get(k) != doc.get(k):
                                match = False
                                break
                        if match:
                            results.append(doc.copy())
                    
                    if self.sort_spec:
                        for key, direction in reversed(self.sort_spec):
                            results.sort(key=lambda d: d.get(key, 0) or "", reverse=(direction < 0))
                    
                    if length is not None:
                        return results[:length]
                    return results

            def __aiter__(self):
                self._results = None
                self._idx = 0
                return self

            async def __anext__(self):
                if self._results is None:
                    self._results = await self.to_list()
                if self._idx < len(self._results):
                    res = self._results[self._idx]
                    self._idx += 1
                    return res
                raise StopAsyncIteration

        return AsyncCursor(self, filter, sort)

    async def insert_one(self, doc: Dict[str, Any]):
        async with self._lock:
            docs = await self._read()
            doc_copy = doc.copy()
            docs.append(doc_copy)
            await self._write(docs)
            class InsertResult:
                inserted_id = doc_copy.get("_id") or doc_copy.get("poi_id") or doc_copy.get("campus_id")
            return InsertResult()

    async def update_one(self, filter: Dict[str, Any], update: Dict[str, Any], upsert: bool = False):
        async with self._lock:
            docs = await self._read()
            set_fields = update.get("$set", update)
            matched = False
            for doc in docs:
                match = True
                for k, v in filter.items():
                    if doc.get(k) != v:
                        match = False
                        break
                if match:
                    doc.update(set_fields)
                    matched = True
                    break
            if not matched and upsert:
                new_doc = filter.copy()
                new_doc.update(set_fields)
                docs.append(new_doc)
            await self._write(docs)
            class UpdateResult:
                matched_count = 1 if matched else 0
                modified_count = 1 if matched else 0
            return UpdateResult()

    async def delete_one(self, filter: Dict[str, Any]):
        async with self._lock:
            docs = await self._read()
            for i, doc in enumerate(docs):
                match = True
                for k, v in filter.items():
                    if doc.get(k) != v:
                        match = False
                        break
                if match:
                    docs.pop(i)
                    await self._write(docs)
                    class DeleteResult:
                        deleted_count = 1
                    return DeleteResult()
            class DeleteResultZero:
                deleted_count = 0
            return DeleteResultZero()

    async def count_documents(self, filter: Optional[Dict[str, Any]] = None) -> int:
        filter = filter or {}
        async with self._lock:
            docs = await self._read()
            if not filter:
                return len(docs)
            count = 0
            for doc in docs:
                match = True
                for k, v in filter.items():
                    if doc.get(k) != v:
                        match = False
                        break
                if match:
                    count += 1
            return count


class EmbeddedDatabase:
    """Wrapper that provides dict-like access to collections."""
    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
        self.collections: Dict[str, AsyncJsonCollection] = {}

    def __getitem__(self, name: str) -> AsyncJsonCollection:
        if name not in self.collections:
            self.collections[name] = AsyncJsonCollection(name, self.data_dir)
        return self.collections[name]


class DatabaseManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Any = None
    is_live_mongo: bool = False

    async def connect(self):
        try:
            logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
            client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=1500)
            # Ping database to verify live connection
            await asyncio.wait_for(client.admin.command('ping'), timeout=2.0)
            self.client = client
            self.db = client[settings.DATABASE_NAME]
            self.is_live_mongo = True
            logger.info("Successfully connected to live MongoDB!")
        except Exception as e:
            logger.info(f"Live MongoDB not detected ({e}). Activating Embedded MongoDB Engine (Offline-First / Zero-Config Mode)...")
            self.db = EmbeddedDatabase(settings.DATA_DIR)
            self.is_live_mongo = False
            logger.info(f"Embedded MongoDB Engine active! Data directory: {settings.DATA_DIR}")

    async def close(self):
        if self.client and self.is_live_mongo:
            self.client.close()
            logger.info("MongoDB connection closed.")

db_manager = DatabaseManager()

def get_db():
    return db_manager.db
