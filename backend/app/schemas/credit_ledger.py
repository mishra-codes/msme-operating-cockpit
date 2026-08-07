from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class CreditLedgerBase(BaseModel):
    customer_id: int
    sale_id: int | None = None
    entry_type: str
    amount: Decimal
    balance_after: Decimal


class CreditLedgerCreate(CreditLedgerBase):
    pass


class CreditLedgerResponse(CreditLedgerBase):
    id: int
    entry_date: datetime

    model_config = ConfigDict(from_attributes=True)