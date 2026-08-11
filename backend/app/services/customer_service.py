from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate
from fastapi import HTTPException

class CustomerService:

    @staticmethod
    def get_all(db: Session):
        return db.query(Customer).all()

    @staticmethod
    def get_by_id(db: Session, customer_id: int):
        return (
            db.query(Customer)
            .filter(Customer.id == customer_id)
            .first()
        )

    @staticmethod
    def create(
        db: Session,
        customer: CustomerCreate,
    ):
        db_customer = Customer(**customer.model_dump())

        db.add(db_customer)
        db.commit()
        db.refresh(db_customer)

        return db_customer

    @staticmethod
    def update(
        db: Session,
        db_customer: Customer,
        customer: CustomerUpdate,
    ):
        update_data = customer.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(db_customer, key, value)

        db.commit()
        db.refresh(db_customer)

        return db_customer

    @staticmethod
    def delete(db: Session, customer):
        # Check for existing sales
        if customer.sales:
            raise HTTPException(
                status_code=409,
                detail="Customer cannot be deleted because they have existing sales."
            )

        # Check for existing credit ledger entries
        if customer.credit_ledger:
            raise HTTPException(
                status_code=409,
                detail="Customer cannot be deleted because they have existing credit records."
            )

        db.delete(customer)
        db.commit()

        return customer