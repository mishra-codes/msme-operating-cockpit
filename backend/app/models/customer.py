from sqlalchemy import Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Customer(TimestampMixin, Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(String(150))

    phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    credit_limit: Mapped[float] = mapped_column(
        Numeric(12, 2),
        default=0,
    )

    sales = relationship(
        "Sale",
        back_populates="customer",
    )

    credit_entries = relationship(
        "CreditLedger",
        back_populates="customer",
    )