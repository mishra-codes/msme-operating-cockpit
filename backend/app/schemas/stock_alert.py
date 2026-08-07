from datetime import datetime

from pydantic import BaseModel, ConfigDict


class StockAlertBase(BaseModel):
    product_id: int
    alert_type: str
    resolved: bool = False


class StockAlertCreate(StockAlertBase):
    pass


class StockAlertResponse(StockAlertBase):
    id: int
    triggered_at: datetime

    model_config = ConfigDict(from_attributes=True)