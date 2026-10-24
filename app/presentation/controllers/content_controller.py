from fastapi import APIRouter, Depends, Header, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.business_logic.services import content_service
from app.data_access.database import get_db
from app.data_access.entities.models import AdminUser
from app.presentation.dtos.content import (
    CampusPOIListRead,
    CampusVersionRead,
    POICreate,
    POIDetailRead,
    POIRead,
    POIUpdate,
)
from app.presentation.middlewares.auth import get_current_admin


router = APIRouter(tags=["POI"])


def _not_found(error: LookupError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))


@router.get(
    "/campuses/{campus_slug}/version",
    response_model=CampusVersionRead,
)
def get_campus_version(
    campus_slug: str,
    session: Session = Depends(get_db),
) -> CampusVersionRead:
    try:
        campus = content_service.require_campus(session, campus_slug)
    except LookupError as error:
        raise _not_found(error) from error
    return CampusVersionRead(version=campus.data_version, last_updated=campus.updated_at)


@router.get(
    "/campuses/{campus_slug}/pois",
    response_model=CampusPOIListRead,
)
def list_campus_pois(
    campus_slug: str,
    response: Response,
    if_none_match: str | None = Header(default=None, alias="If-None-Match"),
    session: Session = Depends(get_db),
) -> CampusPOIListRead | Response:
    try:
        campus = content_service.require_campus(session, campus_slug)
    except LookupError as error:
        raise _not_found(error) from error
    etag = content_service.etag_for_version(campus.data_version)
    response.headers["ETag"] = etag
    response.headers["Cache-Control"] = "public, max-age=0, must-revalidate"
    if content_service.matches_etag(if_none_match, etag):
        return Response(status_code=status.HTTP_304_NOT_MODIFIED, headers=response.headers)
    return CampusPOIListRead(
        campus_slug=campus.slug,
        data_version=campus.data_version,
        pois=content_service.list_public_pois(session, campus),
    )


@router.get("/pois/{poi_id}", response_model=POIDetailRead)
def get_poi_detail(
    poi_id: str,
    session: Session = Depends(get_db),
) -> POIDetailRead:
    try:
        poi = content_service.get_public_poi(session, poi_id)
        campus = content_service.require_campus(session)
    except LookupError as error:
        raise _not_found(error) from error
    return POIDetailRead(
        poi=poi,
        data_version=campus.data_version,
        pois=content_service.list_public_pois(session, campus),
    )


@router.post(
    "/admin/pois",
    response_model=POIRead,
    status_code=status.HTTP_201_CREATED,
)
def create_poi(
    request: POICreate,
    session: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> POIRead:
    try:
        campus = content_service.require_campus(session)
        return content_service.create_poi(session, campus, request.model_dump())
    except LookupError as error:
        raise _not_found(error) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.put("/admin/pois/{poi_id}", response_model=POIRead)
def update_poi(
    poi_id: str,
    request: POIUpdate,
    session: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> POIRead:
    try:
        campus = content_service.require_campus(session)
        poi = content_service.update_poi(
            session,
            campus,
            poi_id,
            request.model_dump(exclude_unset=True),
        )
    except LookupError as error:
        raise _not_found(error) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return poi


@router.delete(
    "/admin/pois/{poi_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_poi(
    poi_id: str,
    session: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> Response:
    try:
        campus = content_service.require_campus(session)
        content_service.soft_delete_poi(session, campus, poi_id)
    except LookupError as error:
        raise _not_found(error) from error
    return Response(status_code=status.HTTP_204_NO_CONTENT)