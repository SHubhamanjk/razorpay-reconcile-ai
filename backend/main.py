"""FastAPI Application for Multi-Source Financial Reconciliation Engine."""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from api.reconciliation import router as reconciliation_router
from api.ai import router as ai_router
from services.file_parser import FileParsingError

app = FastAPI(
    title="Multi-Source Financial Reconciliation Engine",
    description="API for 3-way financial reconciliation of Invoices, Payments, and Bank Transactions.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(FileParsingError)
async def file_parsing_error_handler(request: Request, exc: FileParsingError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": exc.message,
            "file": exc.file_name,
            "column": exc.column,
            "details": exc.details,
        },
    )


app.include_router(reconciliation_router)
app.include_router(ai_router)



@app.get("/", summary="Service status")
def root():
    return {
        "service": "Financial Reconciliation Engine",
        "status": "operational",
        "version": "1.0.0",
    }


@app.get("/health", summary="Health check")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
