from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import health, donor, mobilization

app = FastAPI(
    title="The Base Movement — ML Intelligence API",
    description=(
        "Predictive analytics microservice. "
        "Provides donor propensity scoring and mobilization forecasting "
        "derived from live Supabase data."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(donor.router)
app.include_router(mobilization.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.port, reload=True)
