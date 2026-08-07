from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.cash_transactions import CashTransaction
from app.models.credit_ledger import CreditLedger
from app.models.customer import Customer
from app.models.product import Product
from app.models.purchase import Purchase
from app.models.sale import Sale
from app.models.stock_alert import StockAlert
from app.models.supplier import Supplier


class DashboardService:

    @staticmethod
    def get_summary(db: Session):

        total_products = db.query(Product).count()

        total_customers = db.query(Customer).count()

        total_suppliers = db.query(Supplier).count()

        total_sales = (
            db.query(
                func.coalesce(
                    func.sum(Sale.total_amount),
                    0,
                )
            )
            .scalar()
        )

        total_purchases = (
            db.query(
                func.coalesce(
                    func.sum(Purchase.total_amount),
                    0,
                )
            )
            .scalar()
        )

        cash_in_hand = (
            db.query(
                func.coalesce(
                    func.sum(CashTransaction.amount),
                    0,
                )
            )
            .filter(
                CashTransaction.txn_type == "inflow"
            )
            .scalar()
        )

        outstanding_credit = (
            db.query(
                func.max(CreditLedger.balance_after)
            )
            .scalar()
        )

        if outstanding_credit is None:
            outstanding_credit = Decimal("0.00")

        low_stock_products = (
            db.query(StockAlert)
            .filter(
                StockAlert.resolved == False
            )
            .count()
        )

        return {
            "total_products": total_products,
            "total_customers": total_customers,
            "total_suppliers": total_suppliers,
            "total_sales": total_sales,
            "total_purchases": total_purchases,
            "cash_in_hand": cash_in_hand,
            "outstanding_credit": outstanding_credit,
            "low_stock_products": low_stock_products,
        }

    @staticmethod
    def get_recent_sales(db: Session):

        sales = (
            db.query(Sale)
            .order_by(Sale.sale_date.desc())
            .limit(10)
            .all()
        )

        result = []

        for sale in sales:

            result.append(
                {
                    "id": sale.id,
                    "customer": (
                        sale.customer.name
                        if sale.customer
                        else "Walk-in Customer"
                    ),
                    "payment_mode": sale.payment_mode,
                    "total_amount": sale.total_amount,
                    "sale_date": sale.sale_date,
                }
            )

        return result

    @staticmethod
    def get_recent_purchases(db: Session):

        purchases = (
            db.query(Purchase)
            .order_by(Purchase.purchase_date.desc())
            .limit(10)
            .all()
        )

        result = []

        for purchase in purchases:

            result.append(
                {
                    "id": purchase.id,
                    "supplier": purchase.supplier.name,
                    "total_amount": purchase.total_amount,
                    "purchase_date": purchase.purchase_date,
                }
            )

        return result

    @staticmethod
    def get_low_stock_products(db: Session):

        products = (
            db.query(Product)
            .filter(
                Product.current_stock <= Product.reorder_point
            )
            .order_by(Product.current_stock.asc())
            .all()
        )

        result = []

        for product in products:

            result.append(
                {
                    "id": product.id,
                    "name": product.name,
                    "current_stock": product.current_stock,
                    "reorder_point": product.reorder_point,
                }
            )

        return result


    @staticmethod
    def get_cash_flow(db: Session):

        cash_in = (
            db.query(
                func.coalesce(
                    func.sum(CashTransaction.amount),
                    Decimal("0.00"),
                )
            )
            .filter(
                CashTransaction.txn_type == "inflow"
            )
            .scalar()
        )

        cash_out = (
            db.query(
                func.coalesce(
                    func.sum(CashTransaction.amount),
                    Decimal("0.00"),
                )
            )
            .filter(
                CashTransaction.txn_type == "outflow"
            )
            .scalar()
        )

        return {
            "cash_in": cash_in,
            "cash_out": cash_out,
            "net_cash": cash_in - cash_out,
        }


    @staticmethod
    def get_outstanding_credit(db: Session):

        customers = db.query(Customer).all()

        result = []

        for customer in customers:

            latest_entry = (
                db.query(CreditLedger)
                .filter(
                    CreditLedger.customer_id == customer.id
                )
                .order_by(
                    CreditLedger.id.desc()
                )
                .first()
            )

            if latest_entry and latest_entry.balance_after > 0:

                result.append(
                    {
                        "customer_id": customer.id,
                        "customer_name": customer.name,
                        "outstanding_balance": latest_entry.balance_after,
                    }
                )

        return result

        