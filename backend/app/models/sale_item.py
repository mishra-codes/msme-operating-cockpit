from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class SaleItem(Base):
    __tablename__ = "sale_items"

    id: Mapped[int] = mapped_column(primary_key=True)

    sale_id: Mapped[int] = mapped_column(
        ForeignKey("sales.id", ondelete="CASCADE")
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id")
    )

    quantity: Mapped[float] = mapped_column(
        Numeric(12, 2)
    )

    unit_price: Mapped[float] = mapped_column(
        Numeric(12, 2)
    )

    line_total: Mapped[float] = mapped_column(
        Numeric(12, 2)
    )

    sale = relationship(
        "Sale",
        back_populates="items",
    )


    product = relationship("Product")