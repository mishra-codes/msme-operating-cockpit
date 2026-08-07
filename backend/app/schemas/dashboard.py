from decimal import Decimal
from datetime import datetime

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_products: int
    total_customers: int
    total_suppliers: int

    total_sales: Decimal
    total_purchases: Decimal

    cash_in_hand: Decimal
    outstanding_credit: Decimal

    low_stock_products: int

class RecentSale(BaseModel):
    id: int
    customer: str | None
    payment_mode: str
    total_amount: Decimal
    sale_date: datetime

class RecentPurchase(BaseModel):
    id: int
    supplier: str
    total_amount: Decimal
    purchase_date: datetime

class LowStockProduct(BaseModel):
    id: int
    name: str
    current_stock: Decimal
    reorder_point: Decimal

class CashFlow(BaseModel):
    cash_in: Decimal
    cash_out: Decimal
    net_cash: Decimal

class OutstandingCredit(BaseModel):
    customer_id: int
    customer_name: str
    outstanding_balance: Decimal