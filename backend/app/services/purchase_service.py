from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.purchase import Purchase
from app.models.purchase_item import PurchaseItem
from app.models.supplier import Supplier
from app.schemas.purchase import PurchaseCreate


class PurchaseService:

    @staticmethod
    def get_all(db: Session):
        return db.query(Purchase).all()

    @staticmethod
    def get_by_id(db: Session, purchase_id: int):
        return (
            db.query(Purchase)
            .filter(Purchase.id == purchase_id)
            .first()
        )

    @staticmethod
    def create(db: Session, purchase: PurchaseCreate):

        # Validate supplier
        supplier = (
            db.query(Supplier)
            .filter(Supplier.id == purchase.supplier_id)
            .first()
        )

        if supplier is None:
            raise ValueError("Supplier not found")

        total_amount = Decimal("0.00")

        # Create purchase first
        db_purchase = Purchase(
            supplier_id=purchase.supplier_id,
            created_by=purchase.created_by,
            total_amount=Decimal("0.00"),
        )

        db.add(db_purchase)
        db.flush()  # Generates purchase ID without committing

        # Create purchase items
        for item in purchase.items:

            product = (
                db.query(Product)
                .filter(Product.id == item.product_id)
                .first()
            )

            if product is None:
                raise ValueError(
                    f"Product {item.product_id} not found"
                )

            line_total = item.quantity * item.unit_cost
            total_amount += line_total

            purchase_item = PurchaseItem(
                purchase_id=db_purchase.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_cost=item.unit_cost,
                line_total=line_total,
            )

            db.add(purchase_item)

            # Increase stock
            product.current_stock += item.quantity

        db_purchase.total_amount = total_amount

        db.commit()
        db.refresh(db_purchase)

        return db_purchase

    @staticmethod
    def delete(db: Session, purchase: Purchase):
        db.delete(purchase)
        db.commit()