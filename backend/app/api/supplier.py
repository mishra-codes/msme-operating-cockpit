from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.supplier import (
    SupplierCreate,
    SupplierResponse,
    SupplierUpdate,
)
from app.services.supplier_service import SupplierService

from app.core.security import get_current_user
from app.core.security import require_roles
from app.models.user import User

router = APIRouter(
    prefix="/suppliers",
    tags=["Suppliers"],
)


@router.get("/", response_model=list[SupplierResponse])
def get_suppliers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return SupplierService.get_all(db)


@router.get("/{supplier_id}")
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    supplier = SupplierService.get_by_id(db, supplier_id)

    if supplier is None:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found",
        )

    return {
        "id": supplier.id,
        "name": supplier.name,
        "contact_phone": supplier.contact_phone,
        "contact_email": supplier.contact_email,
        "address": supplier.address,
    }


@router.post("/", response_model=SupplierResponse, status_code=201)
def create_supplier(
    supplier: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "manager")),
):
    return SupplierService.create(db, supplier)


@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int,
    supplier: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "manager")),
):
    db_supplier = SupplierService.get_by_id(db, supplier_id)

    if db_supplier is None:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found",
        )

    return SupplierService.update(
        db,
        db_supplier,
        supplier,
    )


@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner",)),
):
    db_supplier = SupplierService.get_by_id(db, supplier_id)

    if db_supplier is None:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found",
        )

    SupplierService.delete(db, db_supplier)

    return {
        "message": "Supplier deleted successfully"
    } 