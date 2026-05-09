from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, distinct
from app.database import get_db
from app.models import Product
from app.schemas import FilterOptions
from app.utils import year_from_date

router = APIRouter(prefix="/api/filters", tags=["filters"])


@router.get("", response_model=FilterOptions)
def get_filter_options(db: Session = Depends(get_db)):
    manufacturers = db.execute(
        select(distinct(Product.manufacturer)).where(Product.manufacturer.isnot(None))
    ).scalars().all()

    categories = db.execute(
        select(distinct(Product.category)).where(Product.category.isnot(None))
    ).scalars().all()

    subcategories = db.execute(
        select(distinct(Product.subcategory)).where(Product.subcategory.isnot(None))
    ).scalars().all()

    use_locations = db.execute(
        select(distinct(Product.use_location)).where(Product.use_location.isnot(None))
    ).scalars().all()

    report_dates = db.execute(
        select(distinct(Product.report_date)).where(Product.report_date.isnot(None))
    ).scalars().all()

    years = []
    for date_str in report_dates:
        year = year_from_date(date_str)
        if year and year not in years:
            years.append(year)
    years.sort()

    return {
        "manufacturers": [m for m in manufacturers if m],
        "categories": [c for c in categories if c],
        "subcategories": [s for s in subcategories if s],
        "use_locations": [l for l in use_locations if l],
        "years": years
    }
