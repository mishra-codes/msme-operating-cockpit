from fastapi import FastAPI

app = FastAPI(
    title="MSME Operating Cockpit API",
    version="1.0.0",
)


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "MSME Operating Cockpit API",
        "version": "1.0.0",
    }