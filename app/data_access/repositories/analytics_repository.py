from sqlalchemy.orm import Session

from app.data_access.entities.models import ListeningAnalytics


def add_listening_event(
    session: Session,
    *,
    poi_id: str,
    language_code: str,
    trigger_source: str,
    duration_listened_seconds: int,
    completed: bool,
) -> ListeningAnalytics:
    event = ListeningAnalytics(
        poi_id=poi_id,
        language_code=language_code,
        trigger_source=trigger_source,
        duration_listened_seconds=duration_listened_seconds,
        completed=completed,
    )
    session.add(event)
    session.commit()
    session.refresh(event)
    return event
