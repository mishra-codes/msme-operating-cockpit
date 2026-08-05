from fastapi import FastAPI
from app.api.user import router as user_router

app = FastAPI(
    title="MSME Operating Cockpit API",
    version="1.0.0",
)

app.include_router(user_router)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "MSME Operating Cockpit API",
        "version": "1.0.0",
    }