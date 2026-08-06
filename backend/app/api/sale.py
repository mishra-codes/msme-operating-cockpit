from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.sale import (
    SaleCreate,
    SaleResponse,
)
from app.services.sale_service import SaleService

router = APIRouter(
    prefix="/sales",
    tags=["Sales"],
)


@router.get("/", response_model=list[SaleResponse])
def get_sales(db: Session = Depends(get_db)):
    return SaleService.get_all(db)


@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
):
    sale = SaleService.get_by_id(
        db,
        sale_id,
    )

    if sale is None:
        raise HTTPException(
            status_code=404,
            detail="Sale not found",
        )

    return sale


@router.post("/", response_model=SaleResponse, status_code=201)
def create_sale(
    sale: SaleCreate,
    db: Session = Depends(get_db),
):
    try:
        return SaleService.create(
            db,
            sale,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@router.delete("/{sale_id}")
def delete_sale(
    sale_id: int,
    db: Session = Depends(get_db),
):
    db_sale = SaleService.get_by_id(
        db,
        sale_id,
    )

    if db_sale is None:
        raise HTTPException(
            status_code=404,
            detail="Sale not found",
        )

    SaleService.delete(
        db,
        db_sale,
    )

    return {
        "message": "Sale deleted successfully"
    }