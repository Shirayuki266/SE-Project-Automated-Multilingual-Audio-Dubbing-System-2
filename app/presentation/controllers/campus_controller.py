from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.business_logic.services import content_service
from app.data_access.database import get_db
from app.data_access.entities.models import AdminUser
from app.presentation.dtos.campus import CampusRead, CampusUpdate
from app.presentation.middlewares.auth import get_current_admin


router = APIRouter(tags=["Campus"])


@router.get("/campuses/{campus_slug}", response_model=CampusRead)
def get_public_campus(
    campus_slug: str,
    session: Session = Depends(get_db),
) -> CampusRead:
    try:
        return content_service.require_campus(session, campus_slug)
    except LookupError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.get("/admin/campuses/{campus_slug}", response_model=CampusRead)
def get_admin_campus(
    campus_slug: str,
    session: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> CampusRead:
    try:
        return content_service.require_campus(session, campus_slug)
    except LookupError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.put("/admin/campuses/{campus_slug}", response_model=CampusRead)
def update_admin_campus(
    campus_slug: str,
    request: CampusUpdate,
    session: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> CampusRead:
    try:
        campus = content_service.require_campus(session, campus_slug)
        return content_service.update_campus(
            session,
            campus,
            request.model_dump(exclude_unset=True),
        )
    except LookupError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
