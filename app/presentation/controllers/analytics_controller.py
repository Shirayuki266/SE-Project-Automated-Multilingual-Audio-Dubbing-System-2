from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.business_logic.services import analytics_service
from app.data_access.database import get_db
from app.presentation.dtos.analytics import ListeningEventCreate, ListeningEventRead


router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.post(
    "/listening",
    response_model=ListeningEventRead,
    status_code=status.HTTP_201_CREATED,
)
def record_listening(
    request: ListeningEventCreate,
    session: Session = Depends(get_db),
) -> ListeningEventRead:
    try:
        return analytics_service.record_listening_event(
            session,
            **request.model_dump(),
        )
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
