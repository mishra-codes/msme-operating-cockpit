from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class CreditLedger(Base):
    __tablename__ = "credit_ledger"

    id: Mapped[int] = mapped_column(primary_key=True)

    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id")
    )

    sale_id: Mapped[int | None] = mapped_column(
        ForeignKey("sales.id"),
        nullable=True,
    )

    entry_type: Mapped[str] = mapped_column(
        String(30)
    )

    amount: Mapped[float] = mapped_column(
        Numeric(12, 2)
    )

    balance_after: Mapped[float] = mapped_column(
        Numeric(12, 2)
    )

    entry_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    customer = relationship(
        "Customer",
        back_populates="credit_entries",
    )

    sale = relationship("Sale")