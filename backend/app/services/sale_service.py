from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.cash_transactions import CashTransaction
from app.models.credit_ledger import CreditLedger
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
        try:

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

            # Credit sales require a customer
            if (
                sale.payment_mode.lower() == "credit"
                and sale.customer_id is None
            ):
                raise ValueError(
                    "Customer is required for credit sales"
                )

            total_amount = Decimal("0.00")

            db_sale = Sale(
                customer_id=sale.customer_id,
                payment_mode=sale.payment_mode,
                created_by=sale.created_by,
                total_amount=Decimal("0.00"),
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

                line_total = (
                    item.quantity * item.unit_price
                )

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

            # Cash Sale
            if sale.payment_mode.lower() == "cash":

                cash_transaction = CashTransaction(
                    txn_type="inflow",
                    source="sale",
                    reference_id=db_sale.id,
                    amount=total_amount,
                    notes=f"Cash sale #{db_sale.id}",
                )

                db.add(cash_transaction)

            # Credit Sale
            elif sale.payment_mode.lower() == "credit":

                latest_entry = (
                    db.query(CreditLedger)
                    .filter(
                        CreditLedger.customer_id
                        == sale.customer_id
                    )
                    .order_by(
                        CreditLedger.id.desc()
                    )
                    .first()
                )

                previous_balance = (
                    latest_entry.balance_after
                    if latest_entry
                    else Decimal("0.00")
                )

                new_balance = (
                    previous_balance
                    + total_amount
                )

                credit_entry = CreditLedger(
                    customer_id=sale.customer_id,
                    sale_id=db_sale.id,
                    entry_type="sale",
                    amount=total_amount,
                    balance_after=new_balance,
                )

                db.add(credit_entry)

            db.commit()
            db.refresh(db_sale)

            return db_sale

        except Exception:
            db.rollback()
            raise

    @staticmethod
    def delete(
        db: Session,
        db_sale: Sale,
    ):
        db.delete(db_sale)
        db.commit()