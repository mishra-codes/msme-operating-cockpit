from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.purchase import PurchaseCreate, PurchaseResponse
from app.services.purchase_service import PurchaseService

router = APIRouter(
    prefix="/purchases",
    tags=["Purchases"],
)


@router.get("/", response_model=list[PurchaseResponse])
def get_purchases(db: Session = Depends(get_db)):
    return PurchaseService.get_all(db)


@router.get("/{purchase_id}", response_model=PurchaseResponse)
def get_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
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