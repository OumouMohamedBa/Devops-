from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database import get_db
from app.models import Product
from app.schemas import CarbonCalculateRequest, CarbonCalculateResponse, CarbonBreakdown, CarbonEquivalent
from app.utils import carbon_intensity_for_location

router = APIRouter(prefix="/api/carbon", tags=["carbon"])


def to_float(value, default=0.0):
    if value is None:
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


@router.post("/calculate", response_model=CarbonCalculateResponse)
def calculate_carbon(request: CarbonCalculateRequest, db: Session = Depends(get_db)):
    product = db.execute(
        select(Product).where(Product.name == request.product_name)
    ).scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    gwp_total = to_float(product.gwp_total, 0)

    manufacturing_ratio = to_float(product.gwp_manufacturing_ratio, 0.7)
    use_ratio = to_float(product.gwp_use_ratio, 0.2)
    transport_ratio = to_float(product.gwp_transport_ratio, 0.05)
    eol_ratio = to_float(product.gwp_eol_ratio, 0.05)

    manufacturing = gwp_total * manufacturing_ratio
    transport = gwp_total * transport_ratio
    eol = gwp_total * eol_ratio

    yearly_tec = to_float(product.yearly_tec, 0)
    intensity = carbon_intensity_for_location(request.location)

    dynamic_use = (
        (yearly_tec * request.usage_years * intensity / 1000.0) *
        (request.daily_usage_hours / 8.0)
    )

    total_use = dynamic_use
    total_co2 = manufacturing + total_use + transport + eol

    breakdown = CarbonBreakdown(
        manufacturing=round(manufacturing, 2),
        use=round(total_use, 2),
        transport=round(transport, 2),
        eol=round(eol, 2)
    )

    equivalent = CarbonEquivalent(
        km_car=round(total_co2 / 0.192, 2),
        trees=round(total_co2 / 21.0, 2)
    )

    return CarbonCalculateResponse(
        product_name=product.name or "Unknown",
        total_co2=round(total_co2, 2),
        breakdown=breakdown,
        equivalent=equivalent
    )
