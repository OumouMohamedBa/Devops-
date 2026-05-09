from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc
from app.database import get_db
from app.models import Product
from app.schemas import GlobalStats, ProductOut

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/global", response_model=GlobalStats)
def get_global_stats(db: Session = Depends(get_db)):
    total_products = db.execute(
        select(func.count()).select_from(Product)
    ).scalar()

    top_category_row = db.execute(
        select(Product.category, func.count().label("count"))
        .where(Product.category.isnot(None))
        .group_by(Product.category)
        .order_by(desc("count"))
        .limit(1)
    ).first()
    top_category = top_category_row[0] if top_category_row else None

    return GlobalStats(
        total_products=total_products,
        avg_gwp=0,
        top_category=top_category,
        most_polluting_product=None
    )
