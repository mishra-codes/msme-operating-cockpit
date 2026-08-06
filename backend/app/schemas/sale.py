from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class SaleItemBase(BaseModel):
    product_id: int
    quantity: Decimal
    unit_price: Decimal


class SaleItemCreate(SaleItemBase):
    pass


class SaleItemResponse(SaleItemBase):
    id: int
    line_total: Decimal

    model_config = ConfigDict(from_attributes=True)


class SaleBase(BaseModel):
    customer_id: int | None = None
    payment_mode: str = "cash"
    created_by: int

class SaleCreate(SaleBase):
    items: list[SaleItemCreate]


class SaleResponse(SaleBase):
    id: int
    sale_date: datetime
    total_amount: Decimal
    items: list[SaleItemResponse]

    model_config = ConfigDict(from_attributes=True)