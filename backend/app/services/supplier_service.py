from sqlalchemy.orm import Session

from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate


class SupplierService:

    @staticmethod
    def get_all(db: Session):
        return db.query(Supplier).all()

    @staticmethod
    def get_by_id(
        db: Session,
        supplier_id: int,
    ):
        return db.query(Supplier).filter(
            Supplier.id == supplier_id
        ).first()

    @staticmethod
    def create(
        db: Session,
        supplier: SupplierCreate,
    ):
        db_supplier = Supplier(**supplier.model_dump())

        db.add(db_supplier)
        db.commit()
        db.refresh(db_supplier)

        return db_supplier