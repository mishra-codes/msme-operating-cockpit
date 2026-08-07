from sqlalchemy.orm import Session

from app.models.cash_transactions import CashTransaction
from app.schemas.cash_transaction import CashTransactionCreate


class CashTransactionService:

    @staticmethod
    def get_all(db: Session):
        return db.query(CashTransaction).all()

    @staticmethod
    def get_by_id(
        db: Session,
        transaction_id: int,
    ):
        return (
            db.query(CashTransaction)
            .filter(CashTransaction.id == transaction_id)
            .first()
        )

    @staticmethod
    def create(
        db: Session,
        transaction: CashTransactionCreate,
    ):
        db_transaction = CashTransaction(
            **transaction.model_dump()
        )

        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)

        return db_transaction

    @staticmethod
    def delete(
        db: Session,
        db_transaction: CashTransaction,
    ):
        db.delete(db_transaction)
        db.commit()