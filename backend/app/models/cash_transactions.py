from datetime import datetime

from sqlalchemy import DateTime, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class CashTransaction(Base):
    __tablename__ = "cash_transactions"

    id: Mapped[int] = mapped_column(primary_key=True)

    txn_type: Mapped[str] = mapped_column(
        String(20)
    )  # inflow / outflow

    source: Mapped[str] = mapped_column(
        String(30)
    )  # sale / purchase / expense / credit_payment

    reference_id: Mapped[int | None] = mapped_column(
        nullable=True
    )

    amount: Mapped[float] = mapped_column(
        Numeric(12, 2)
    )

    txn_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    notes: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )