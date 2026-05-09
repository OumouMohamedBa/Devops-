import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.seed_csv import seed_products_from_csv

from app.routers import products, filters, carbon, stats, infrastructure, logs

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created")

    # csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "boavizta-data-fr.csv")
    # seed_products_from_csv(csv_path)

    yield

    print("Shutting down...")


app = FastAPI(
    title="Boavizta Carbon API",
    description="API pour calculer l'empreinte carbone des produits IT",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://10.241.109.60:4201",
        "http://localhost:4201",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(filters.router)
app.include_router(carbon.router)
app.include_router(stats.router)
app.include_router(infrastructure.router)
app.include_router(logs.router)


@app.get("/")
def root():
    return {
        "message": "Boavizta Carbon API",
        "docs": "/docs",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))
    uvicorn.run(app, host=host, port=port)
