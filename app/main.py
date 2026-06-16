"""
Outpatient Symptom Triage Assistant — FastAPI application entry point.

Run locally:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Swagger UI: http://localhost:8000/docs
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.routes import auth
from app.routes.health import router as health_router
from app.routes.triage import router as triage_router
from app.routes.symptoms import router as symptoms_router
from app.routes.doctors import router as doctors_router
from app.routes.inventory import router as inventory_router
from app.routes.patients import router as patients_router
from app.routes.tokens import router as tokens_router
from app.utils.logger import get_logger
from fastapi.middleware.cors import CORSMiddleware

logger = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Outpatient Triage API started successfully")
    yield
    logger.info("Outpatient Triage API shutting down")


app = FastAPI(
    title="Outpatient Symptom Triage Assistant",
    description="Rural PHC triage system — Phase 1",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(health_router)
app.include_router(triage_router)
app.include_router(symptoms_router)
app.include_router(doctors_router)
app.include_router(inventory_router)
app.include_router(patients_router)
app.include_router(tokens_router)
app.include_router(auth.router)


# ── Centralized exception handlers ───────────────────────────────────────────

@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    logger.error("Validation error on %s: %s", request.url.path, exc)
    return JSONResponse(status_code=422, content={"error": exc.errors()})


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    logger.error("ValueError on %s: %s", request.url.path, exc)
    return JSONResponse(status_code=400, content={"error": str(exc)})


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(status_code=500, content={"error": "Internal server error"})



