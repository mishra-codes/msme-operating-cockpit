from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    id: Mapped[int] = mapped_column(primary_key=True)

    purchase_id: Mapped[int] = mapped_column(
        ForeignKey("purchases.id", ondelete="CASCADE")
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id")
    )

    quantity: Mapped[float] = mapped_column(
        Numeric(12, 2)
    )

    unit_cost: Mapped[float] = mapped_column(
        Numeric(12, 2)
    )

    line_total: Mapped[float] = mapped_column(
        Numeric(12, 2)
    )

    purchase = relationship(
        "Purchase",
        back_populates="items",
    )

    product = relationship("Product")