from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[int] = mapped_column(primary_key=True)

    customer_id: Mapped[int | None] = mapped_column(
        ForeignKey("customers.id"),
        nullable=True,   # Walk-in customers
    )

    sale_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    payment_mode: Mapped[str] = mapped_column(
        String(20),
        default="cash",
    )

    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2)
    )

    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id")
    )

    customer = relationship(
        "Customer",
        back_populates="sales",
    )

    created_by_user = relationship(
    "User",
    back_populates="sales",
    )

    items = relationship(
        "SaleItem",
        back_populates="sale",
        cascade="all, delete-orphan",
    )