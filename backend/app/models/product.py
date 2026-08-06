from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Product(TimestampMixin, Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)

    sku: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
    )

    category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    unit: Mapped[str] = mapped_column(
        String(20),
        default="pcs",
    )

    cost_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
    )

    sell_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
    )

    current_stock: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=0,
    )

    reorder_point: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=0,
    )

    supplier_id: Mapped[int | None] = mapped_column(
        ForeignKey("suppliers.id"),
        nullable=True,
    )

    supplier = relationship(
        "Supplier",
        back_populates="products",
    )

    purchase_items = relationship(
        "PurchaseItem",
        back_populates="product",
    )

    sale_items = relationship(
        "SaleItem",
        back_populates="product",
    )

    stock_alerts = relationship(
        "StockAlert",
        back_populates="product",
    )