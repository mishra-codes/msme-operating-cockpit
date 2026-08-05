from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class PurchaseItemBase(BaseModel):
    product_id: int
    quantity: Decimal
    unit_cost: Decimal


class PurchaseItemCreate(PurchaseItemBase):
    pass


class PurchaseItemResponse(PurchaseItemBase):
    id: int
    line_total: Decimal

    model_config = ConfigDict(from_attributes=True)


class PurchaseBase(BaseModel):
    supplier_id: int


class PurchaseCreate(PurchaseBase):
    items: list[PurchaseItemCreate]


class PurchaseResponse(PurchaseBase):
    id: int
    purchase_date: datetime
    total_amount: Decimal
    created_by: int
    items: list[PurchaseItemResponse]

    model_config = ConfigDict(from_attributes=True)