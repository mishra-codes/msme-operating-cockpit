from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Purchase(Base):
    __tablename__ = "purchases"

    id: Mapped[int] = mapped_column(primary_key=True)

    supplier_id: Mapped[int] = mapped_column(
        ForeignKey("suppliers.id")
    )

    purchase_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    total_amount: Mapped[float] = mapped_column(
        Numeric(12, 2)
    )

    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id")
    )

    supplier = relationship(
        "Supplier",
        back_populates="purchases",
    )

    created_by_user = relationship(
        "User",
    )

    items = relationship(
        "PurchaseItem",
        back_populates="purchase",
        cascade="all, delete-orphan",
    )