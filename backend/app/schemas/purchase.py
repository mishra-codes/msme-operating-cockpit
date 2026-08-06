from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class PurchaseItemCreate(BaseModel):
    product_id: int
    quantity: Decimal
    unit_cost: Decimal


class PurchaseCreate(BaseModel):
    supplier_id: int
    created_by: int
    items: list[PurchaseItemCreate]


class PurchaseItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: Decimal
    unit_cost: Decimal
    line_total: Decimal

    model_config = ConfigDict(from_attributes=True)


class PurchaseResponse(BaseModel):
    id: int
    supplier_id: int
    purchase_date: datetime
    total_amount: Decimal
    created_by: int
    items: list[PurchaseItemResponse]

    model_config = ConfigDict(from_attributes=True)