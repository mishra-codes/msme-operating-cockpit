from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.stock_alert import StockAlert
from app.schemas.stock_alert import StockAlertCreate


class StockAlertService:

    @staticmethod
    def get_all(db: Session):
        return db.query(StockAlert).all()

    @staticmethod
    def get_by_id(
        db: Session,
        alert_id: int,
    ):
        return (
            db.query(StockAlert)
            .filter(StockAlert.id == alert_id)
            .first()
        )

    @staticmethod
    def create(
        db: Session,
        alert: StockAlertCreate,
    ):
        product = (
            db.query(Product)
            .filter(Product.id == alert.product_id)
            .first()
        )

        if product is None:
            raise ValueError("Product not found")

        db_alert = StockAlert(
            product_id=alert.product_id,
            alert_type=alert.alert_type,
            resolved=alert.resolved,
        )

        db.add(db_alert)
        db.commit()
        db.refresh(db_alert)

        return db_alert

    @staticmethod
    def delete(
        db: Session,
        db_alert: StockAlert,
    ):
        db.delete(db_alert)
        db.commit()