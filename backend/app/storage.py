"""
Lightweight session store.

Each uploaded dataset gets a UUID session. We keep a small in-memory cache
for speed, backed by on-disk joblib files so the process can restart or
scale to multiple workers without losing in-flight sessions sharing a disk.

This is intentionally simple (no external DB/Redis) to keep the project
easy to run locally, but it is isolated behind a small interface
(`SessionStore`) so swapping in Redis/S3 later only touches this file.
"""
import os
import shutil
import uuid
from typing import Any, Optional

import joblib

from app.config import SESSIONS_DIR


class SessionStore:
    def __init__(self, base_dir: str = SESSIONS_DIR):
        self.base_dir = base_dir
        self._cache: dict[str, dict[str, Any]] = {}

    # ---- session lifecycle -------------------------------------------------
    def create_session(self) -> str:
        session_id = uuid.uuid4().hex
        os.makedirs(self._session_dir(session_id), exist_ok=True)
        self._cache[session_id] = {}
        return session_id

    def exists(self, session_id: str) -> bool:
        return os.path.isdir(self._session_dir(session_id))

    def delete_session(self, session_id: str) -> None:
        self._cache.pop(session_id, None)
        path = self._session_dir(session_id)
        if os.path.isdir(path):
            shutil.rmtree(path)

    # ---- generic get/set ----------------------------------------------------
    def set(self, session_id: str, key: str, value: Any, persist: bool = True) -> None:
        self._cache.setdefault(session_id, {})[key] = value
        if persist:
            joblib.dump(value, self._artifact_path(session_id, key))

    def get(self, session_id: str, key: str, default: Optional[Any] = None) -> Any:
        if session_id in self._cache and key in self._cache[session_id]:
            return self._cache[session_id][key]
        path = self._artifact_path(session_id, key)
        if os.path.exists(path):
            value = joblib.load(path)
            self._cache.setdefault(session_id, {})[key] = value
            return value
        return default

    def model_path(self, session_id: str, model_key: str) -> str:
        """Path to a persisted, downloadable model artifact."""
        return self._artifact_path(session_id, f"model_{model_key}")

    # ---- internals -----------------------------------------------------------
    def _session_dir(self, session_id: str) -> str:
        return os.path.join(self.base_dir, session_id)

    def _artifact_path(self, session_id: str, key: str) -> str:
        return os.path.join(self._session_dir(session_id), f"{key}.joblib")


# Singleton used across routers (simple dependency-injection style import)
store = SessionStore()
