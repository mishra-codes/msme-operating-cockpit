from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.stock_alert import (
    StockAlertCreate,
    StockAlertResponse,
)
from app.services.stock_alert import StockAlertService

from app.core.security import get_current_user
from app.core.security import require_roles
from app.models.user import User

router = APIRouter(
    prefix="/stock-alerts",
    tags=["Stock Alerts"],
)


@router.get("/", response_model=list[StockAlertResponse])
def get_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return StockAlertService.get_all(db)


@router.get(
    "/{alert_id}",
    response_model=StockAlertResponse,
)
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = StockAlertService.get_by_id(
        db,
        alert_id,
    )

    if alert is None:
        raise HTTPException(
            status_code=404,
            detail="Alert not found",
        )

    return alert


@router.post(
    "/",
    response_model=StockAlertResponse,
    status_code=201,
)
def create_alert(
    alert: StockAlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "manager")),
):
    try:
        return StockAlertService.create(
            db,
            alert,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@router.delete("/{alert_id}")
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner",)),
):
    db_alert = StockAlertService.get_by_id(
        db,
        alert_id,
    )

    if db_alert is None:
        raise HTTPException(
            status_code=404,
            detail="Alert not found",
        )

    StockAlertService.delete(
        db,
        db_alert,
    )

    return {
        "message": "Alert deleted successfully"
    }