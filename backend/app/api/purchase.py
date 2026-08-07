from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.purchase import PurchaseCreate, PurchaseResponse
from app.services.purchase_service import PurchaseService


from app.core.security import get_current_user
from app.core.security import require_roles
from app.models.user import User

router = APIRouter(
    prefix="/purchases",
    tags=["Purchases"],
)


@router.get("/", response_model=list[PurchaseResponse])
def get_purchases(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return PurchaseService.get_all(db)


@router.get("/{purchase_id}", response_model=PurchaseResponse)
def get_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    purchase = PurchaseService.get_by_id(db, purchase_id)

    if purchase is None:
        raise HTTPException(
            status_code=404,
            detail="Purchase not found",
        )

    return purchase


@router.post("/", response_model=PurchaseResponse, status_code=201)
def create_purchase(
    purchase: PurchaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "manager")),
):
    try:
        return PurchaseService.create(db, purchase)

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@router.delete("/{purchase_id}")
def delete_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner",)),
):
    purchase = PurchaseService.get_by_id(db, purchase_id)

    if purchase is None:
        raise HTTPException(
            status_code=404,
            detail="Purchase not found",
        )

    PurchaseService.delete(db, purchase)

    return {
        "message": "Purchase deleted successfully"
    }