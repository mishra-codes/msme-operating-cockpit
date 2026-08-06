from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.user import User
from app.schemas.sale import SaleCreate


class SaleService:

    @staticmethod
    def get_all(db: Session):
        return db.query(Sale).all()

    @staticmethod
    def get_by_id(db: Session, sale_id: int):
        return (
            db.query(Sale)
            .filter(Sale.id == sale_id)
            .first()
        )

    @staticmethod
    def create(
        db: Session,
        sale: SaleCreate,
    ):
        # Validate customer (optional)
        if sale.customer_id is not None:
            customer = (
                db.query(Customer)
                .filter(Customer.id == sale.customer_id)
                .first()
            )

            if customer is None:
                raise ValueError("Customer not found")

        # Validate user
        user = (
            db.query(User)
            .filter(User.id == sale.created_by)
            .first()
        )

        if user is None:
            raise ValueError("User not found")

        total_amount = Decimal("0.00")

        db_sale = Sale(
            customer_id=sale.customer_id,
            payment_mode=sale.payment_mode,
            created_by=sale.created_by,
            total_amount=0,
        )

        db.add(db_sale)
        db.flush()

        for item in sale.items:

            product = (
                db.query(Product)
                .filter(Product.id == item.product_id)
                .first()
            )

            if product is None:
                raise ValueError(
                    f"Product {item.product_id} not found"
                )

            if product.current_stock < item.quantity:
                raise ValueError(
                    f"Insufficient stock for {product.name}"
                )

            line_total = item.quantity * item.unit_price

            sale_item = SaleItem(
                sale_id=db_sale.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                line_total=line_total,
            )

            db.add(sale_item)

            # Reduce stock
            product.current_stock -= item.quantity

            total_amount += line_total

        db_sale.total_amount = total_amount

        db.commit()
        db.refresh(db_sale)

        return db_sale

    @staticmethod
    def delete(
        db: Session,
        db_sale: Sale,
    ):
        db.delete(db_sale)
        db.commit()