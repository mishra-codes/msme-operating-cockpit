from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ProductBase(BaseModel):
    sku: str
    name: str
    category: str | None = None
    unit: str = "pcs"
    cost_price: Decimal
    sell_price: Decimal
    current_stock: Decimal = Decimal("0.00")
    reorder_point: Decimal = Decimal("0.00")
    supplier_id: int | None = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    sku: str | None = None
    name: str | None = None
    category: str | None = None
    unit: str | None = None
    cost_price: Decimal | None = None
    sell_price: Decimal | None = None
    current_stock: Decimal | None = None
    reorder_point: Decimal | None = None
    supplier_id: int | None = None


class ProductResponse(ProductBase):
    id: int

    model_config = ConfigDict(from_attributes=True)