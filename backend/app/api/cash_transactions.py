from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.cash_transaction import (
    CashTransactionCreate,
    CashTransactionResponse,
)

from app.services.cash_transactions import CashTransactionService

from app.core.security import get_current_user
from app.core.security import require_roles
from app.models.user import User

router = APIRouter(
    prefix="/cash-transactions",
    tags=["Cash Transactions"],
)


@router.get("/", response_model=list[CashTransactionResponse])
def get_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return CashTransactionService.get_all(db)


@router.get(
    "/{transaction_id}",
    response_model=CashTransactionResponse,
)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transaction = CashTransactionService.get_by_id(
        db,
        transaction_id,
    )

    if transaction is None:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found",
        )

    return transaction


@router.post(
    "/",
    response_model=CashTransactionResponse,
    status_code=201,
)
def create_transaction(
    transaction: CashTransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner",)),
):
    return CashTransactionService.create(
        db,
        transaction,
    )


@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner",)),
):
    db_transaction = CashTransactionService.get_by_id(
        db,
        transaction_id,
    )

    if db_transaction is None:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found",
        )

    CashTransactionService.delete(
        db,
        db_transaction,
    )

    return {
        "message": "Transaction deleted successfully"
    }