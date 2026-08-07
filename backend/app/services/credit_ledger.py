from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.credit_ledger import CreditLedger
from app.models.customer import Customer
from app.schemas.credit_ledger import CreditLedgerCreate


class CreditLedgerService:

    @staticmethod
    def get_all(db: Session):
        return db.query(CreditLedger).all()

    @staticmethod
    def get_by_id(
        db: Session,
        entry_id: int,
    ):
        return (
            db.query(CreditLedger)
            .filter(CreditLedger.id == entry_id)
            .first()
        )

    @staticmethod
    def create(
        db: Session,
        ledger: CreditLedgerCreate,
    ):
        customer = (
            db.query(Customer)
            .filter(Customer.id == ledger.customer_id)
            .first()
        )

        if customer is None:
            raise ValueError("Customer not found")

        db_entry = CreditLedger(
            customer_id=ledger.customer_id,
            sale_id=ledger.sale_id,
            entry_type=ledger.entry_type,
            amount=ledger.amount,
            balance_after=ledger.balance_after,
        )

        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)

        return db_entry

    @staticmethod
    def delete(
        db: Session,
        db_entry: CreditLedger,
    ):
        db.delete(db_entry)
        db.commit()