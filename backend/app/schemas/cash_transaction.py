from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class CashTransactionBase(BaseModel):
    txn_type: str
    source: str
    reference_id: int | None = None
    amount: Decimal
    notes: str | None = None


class CashTransactionCreate(CashTransactionBase):
    pass


class CashTransactionResponse(CashTransactionBase):
    id: int
    txn_date: datetime

    model_config = ConfigDict(from_attributes=True)