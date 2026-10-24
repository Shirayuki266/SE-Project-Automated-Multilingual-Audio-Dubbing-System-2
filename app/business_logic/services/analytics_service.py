from sqlalchemy.orm import Session

from app.data_access.entities.models import ListeningAnalytics
from app.data_access.repositories import analytics_repository, content_repository


def record_listening_event(
    session: Session,
    *,
    poi_id: str,
    language_code: str,
    trigger_source: str,
    duration_listened_seconds: int,
    completed: bool,
) -> ListeningAnalytics:
    poi = content_repository.get_poi(session, poi_id)
    if poi is None or not poi.is_active:
        raise LookupError("Không tìm thấy điểm tham quan")
    return analytics_repository.add_listening_event(
        session,
        poi_id=poi_id,
        language_code=language_code,
        trigger_source=trigger_source,
        duration_listened_seconds=duration_listened_seconds,
        completed=completed,
    )
