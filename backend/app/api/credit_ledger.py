from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.credit_ledger import (
    CreditLedgerCreate,
    CreditLedgerResponse,
)
from app.services.credit_ledger import (
    CreditLedgerService,
)

router = APIRouter(
    prefix="/credit-ledger",
    tags=["Credit Ledger"],
)


@router.get("/", response_model=list[CreditLedgerResponse])
def get_entries(
    db: Session = Depends(get_db),
):
    return CreditLedgerService.get_all(db)


@router.get(
    "/{entry_id}",
    response_model=CreditLedgerResponse,
)
def get_entry(
    entry_id: int,
    db: Session = Depends(get_db),
):
    entry = CreditLedgerService.get_by_id(
        db,
        entry_id,
    )

    if entry is None:
        raise HTTPException(
            status_code=404,
            detail="Credit entry not found",
        )

    return entry


@router.post(
    "/",
    response_model=CreditLedgerResponse,
    status_code=201,
)
def create_entry(
    entry: CreditLedgerCreate,
    db: Session = Depends(get_db),
):
    try:
        return CreditLedgerService.create(
            db,
            entry,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@router.delete("/{entry_id}")
def delete_entry(
    entry_id: int,
    db: Session = Depends(get_db),
):
    db_entry = CreditLedgerService.get_by_id(
        db,
        entry_id,
    )

    if db_entry is None:
        raise HTTPException(
            status_code=404,
            detail="Credit entry not found",
        )

    CreditLedgerService.delete(
        db,
        db_entry,
    )

    return {
        "message": "Credit entry deleted successfully"
    }