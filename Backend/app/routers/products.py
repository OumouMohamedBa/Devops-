from typing import Optional, List, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_
from app.database import get_db
from app.models import Product

router = APIRouter(prefix="/api/products", tags=["products"])


def product_to_dict(p: Product) -> dict:
    return {
        "manufacturer": p.manufacturer,
        "name": p.name,
        "category": p.category,
        "subcategory": p.subcategory,
        "gwp_total": p.gwp_total,
        "gwp_use_ratio": p.gwp_use_ratio,
        "yearly_tec": p.yearly_tec,
        "lifetime": p.lifetime,
        "use_location": p.use_location,
        "report_date": p.report_date,
        "sources": p.sources,
        "sources_hash": p.sources_hash,
        "gwp_error_ratio": p.gwp_error_ratio,
        "gwp_manufacturing_ratio": p.gwp_manufacturing_ratio,
        "weight": p.weight,
        "assembly_location": p.assembly_location,
        "screen_size": p.screen_size,
        "server_type": p.server_type,
        "hard_drive": p.hard_drive,
        "memory": p.memory,
        "number_cpu": p.number_cpu,
        "height": p.height,
        "added_date": p.added_date,
        "add_method": p.add_method,
        "gwp_transport_ratio": p.gwp_transport_ratio,
        "gwp_eol_ratio": p.gwp_eol_ratio,
        "gwp_electronics_ratio": p.gwp_electronics_ratio,
        "gwp_battery_ratio": p.gwp_battery_ratio,
        "gwp_hdd_ratio": p.gwp_hdd_ratio,
        "gwp_ssd_ratio": p.gwp_ssd_ratio,
        "gwp_othercomponents_ratio": p.gwp_othercomponents_ratio,
        "comment": p.comment,
    }


@router.get("")
def get_products(
    manufacturer: Optional[str] = None,
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    location: Optional[str] = None,
    year: Optional[int] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = Query(None, enum=["gwp_total", "report_date", "manufacturer", "name"]),
    sort_order: str = Query("asc", enum=["asc", "desc"]),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
) -> Any:
    stmt = select(Product)

    if manufacturer:
        stmt = stmt.where(Product.manufacturer.ilike(f"%{manufacturer}%"))
    if category:
        stmt = stmt.where(Product.category.ilike(f"%{category}%"))
    if subcategory:
        stmt = stmt.where(Product.subcategory.ilike(f"%{subcategory}%"))
    if location:
        stmt = stmt.where(Product.use_location.ilike(f"%{location}%"))

    if search:
        stmt = stmt.where(
            or_(
                Product.manufacturer.ilike(f"%{search}%"),
                Product.name.ilike(f"%{search}%"),
                Product.subcategory.ilike(f"%{search}%")
            )
        )

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar()

    if sort_by:
        sort_col = getattr(Product, sort_by)
        if sort_order == "desc":
            sort_col = sort_col.desc()
        stmt = stmt.order_by(sort_col)

    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)

    products = db.execute(stmt).scalars().all()

    return {
        "items": [product_to_dict(p) for p in products],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.get("/name/{product_name}")
def get_product_by_name(product_name: str, db: Session = Depends(get_db)) -> Any:
    product = db.execute(select(Product).where(Product.name == product_name)).scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product_to_dict(product)
