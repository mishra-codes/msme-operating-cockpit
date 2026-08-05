from decimal import Decimal

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_products: int
    total_customers: int
    total_suppliers: int

    total_sales: Decimal
    total_purchases: Decimal

    low_stock_items: int

    outstanding_credit: Decimal