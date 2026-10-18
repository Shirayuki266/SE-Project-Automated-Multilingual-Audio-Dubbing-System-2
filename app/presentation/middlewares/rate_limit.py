from collections import defaultdict
from threading import Lock
from time import monotonic

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response
from starlette.types import ASGIApp


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, *, requests_per_minute: int = 120) -> None:
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self._requests: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        key = client_ip
        limit = self.requests_per_minute
        if request.url.path == "/api/v1/auth/login":
            key = f"login:{client_ip}"
            limit = min(limit, 10)
        now = monotonic()
        with self._lock:
            recent = [timestamp for timestamp in self._requests[key] if now - timestamp < 60]
            if len(recent) >= limit:
                self._requests[key] = recent
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Quá nhiều yêu cầu. Vui lòng thử lại sau."},
                    headers={"Retry-After": "60"},
                )
            recent.append(now)
            self._requests[key] = recent
            if len(self._requests) > 10000:
                self._requests = defaultdict(
                    list,
                    {
                        ip: entries
                        for ip, entries in self._requests.items()
                        if entries and now - entries[-1] < 60
                    },
                )
        return await call_next(request)
