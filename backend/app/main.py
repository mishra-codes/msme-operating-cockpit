from fastapi import FastAPI
from app.api.user import router as user_router
from app.api.product import router as product_router
from app.api.supplier import router as supplier_router
from app.api.customer import router as customer_router
from app.api.purchase import router as purchase_router
from app.api.sale import router as sale_router
from app.api.cash_transactions import router as cash_transaction_router
from app.api.credit_ledger import router as credit_ledger_router
from app.api.stock_alerts import router as stock_alerts_router      

app = FastAPI(
    title="MSME Operating Cockpit API",
    version="1.0.0",
)

app.include_router(user_router)
app.include_router(product_router)
app.include_router(supplier_router)
app.include_router(customer_router)
app.include_router(purchase_router)
app.include_router(sale_router)
app.include_router(cash_transaction_router)
app.include_router(credit_ledger_router)
app.include_router(stock_alerts_router)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "MSME Operating Cockpit API",
        "version": "1.0.0",
    }