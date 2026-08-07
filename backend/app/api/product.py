from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.product import ProductResponse
from app.services.product_service import ProductService
from app.schemas.product import ProductCreate , ProductUpdate , ProductResponse
from app.schemas.product import ProductResponse , ProductCreate , ProductUpdate

from app.core.security import get_current_user
from app.core.security import require_roles
from app.models.user import User

router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


@router.get("/", response_model=list[ProductResponse])
def get_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ProductService.get_all(db)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int,
                 db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    product = ProductService.get_by_id(db, product_id)

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    return product

@router.post("/", response_model=ProductResponse, status_code=201)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "manager")),
):
    # Check duplicate SKU
    if ProductService.get_by_sku(db, product.sku):
        raise HTTPException(
            status_code=400,
            detail="SKU already exists",
        )

    # Business rule
    if product.sell_price < product.cost_price:
        raise HTTPException(
            status_code=400,
            detail="Selling price cannot be less than cost price",
        )

    return ProductService.create(db, product)

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "manager")),
):
    db_product = ProductService.get_by_id(db, product_id)

    if db_product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    return ProductService.update(
        db,
        db_product,
        product,
    )

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", )),
):
    db_product = ProductService.get_by_id(db, product_id)

    if db_product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    ProductService.delete(db, db_product)

    return {
        "message": "Product deleted successfully"
    }
