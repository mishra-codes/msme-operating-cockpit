from pydantic import BaseModel, ConfigDict


class SupplierBase(BaseModel):
    name: str
    contact_phone: str | None = None
    contact_email: str | None = None
    address: str | None = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: str | None = None
    contact_phone: str | None = None
    contact_email: str | None = None
    address: str | None = None


class SupplierResponse(SupplierBase):
    id: int

    model_config = ConfigDict(from_attributes=True)