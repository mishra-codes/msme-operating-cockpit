from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.dashboard import DashboardSummary, RecentSale
from app.services.dashboard_service import DashboardService

from app.core.security import get_current_user
from app.models.user import User

from app.schemas.dashboard import (
    RecentPurchase ,
    DashboardSummary , 
    RecentSale , 
    LowStockProduct , 
    CashFlow ,
    OutstandingCredit,
)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/summary",
    response_model=DashboardSummary,
)
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return DashboardService.get_summary(db)

@router.get(
    "/recent-sales",
    response_model=list[RecentSale],
)
def recent_sales(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return DashboardService.get_recent_sales(db)


@router.get(
    "/recent-purchases",
    response_model=list[RecentPurchase],
)
def recent_purchases(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return DashboardService.get_recent_purchases(db)

@router.get(
    "/low-stock",
    response_model=list[LowStockProduct],
)
def low_stock_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return DashboardService.get_low_stock_products(db)


@router.get(
    "/cash-flow",
    response_model=CashFlow,
)
def cash_flow(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return DashboardService.get_cash_flow(db)

@router.get(
    "/outstanding-credit",
    response_model=list[OutstandingCredit],
)
def outstanding_credit(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return DashboardService.get_outstanding_credit(db)