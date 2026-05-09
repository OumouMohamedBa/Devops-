from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime


class ProductBase(BaseModel):
    manufacturer: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    gwp_total: Optional[str] = None
    gwp_use_ratio: Optional[str] = None
    yearly_tec: Optional[str] = None
    lifetime: Optional[str] = None
    use_location: Optional[str] = None
    report_date: Optional[str] = None
    sources: Optional[str] = None
    sources_hash: Optional[str] = None
    gwp_error_ratio: Optional[str] = None
    gwp_manufacturing_ratio: Optional[str] = None
    weight: Optional[str] = None
    assembly_location: Optional[str] = None
    screen_size: Optional[str] = None
    server_type: Optional[str] = None
    hard_drive: Optional[str] = None
    memory: Optional[str] = None
    number_cpu: Optional[str] = None
    height: Optional[str] = None
    added_date: Optional[str] = None
    add_method: Optional[str] = None
    gwp_transport_ratio: Optional[str] = None
    gwp_eol_ratio: Optional[str] = None
    gwp_electronics_ratio: Optional[str] = None
    gwp_battery_ratio: Optional[str] = None
    gwp_hdd_ratio: Optional[str] = None
    gwp_ssd_ratio: Optional[str] = None
    gwp_othercomponents_ratio: Optional[str] = None
    comment: Optional[str] = None


class ProductOut(BaseModel):
    manufacturer: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    gwp_total: Optional[str] = None
    gwp_use_ratio: Optional[str] = None
    yearly_tec: Optional[str] = None
    lifetime: Optional[str] = None
    use_location: Optional[str] = None
    report_date: Optional[str] = None
    sources: Optional[str] = None
    sources_hash: Optional[str] = None
    gwp_error_ratio: Optional[str] = None
    gwp_manufacturing_ratio: Optional[str] = None
    weight: Optional[str] = None
    assembly_location: Optional[str] = None
    screen_size: Optional[str] = None
    server_type: Optional[str] = None
    hard_drive: Optional[str] = None
    memory: Optional[str] = None
    number_cpu: Optional[str] = None
    height: Optional[str] = None
    added_date: Optional[str] = None
    add_method: Optional[str] = None
    gwp_transport_ratio: Optional[str] = None
    gwp_eol_ratio: Optional[str] = None
    gwp_electronics_ratio: Optional[str] = None
    gwp_battery_ratio: Optional[str] = None
    gwp_hdd_ratio: Optional[str] = None
    gwp_ssd_ratio: Optional[str] = None
    gwp_othercomponents_ratio: Optional[str] = None
    comment: Optional[str] = None

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    items: List[ProductOut]
    total: int
    page: int
    page_size: int


class FilterOptions(BaseModel):
    manufacturers: List[str]
    categories: List[str]
    subcategories: List[str]
    use_locations: List[str]
    years: List[int]


class CarbonCalculateRequest(BaseModel):
    product_name: str
    usage_years: float = 5.0
    location: str = "EU"
    daily_usage_hours: float = 8.0


class CarbonBreakdown(BaseModel):
    manufacturing: float
    use: float
    transport: float
    eol: float


class CarbonEquivalent(BaseModel):
    km_car: float
    trees: float


class CarbonCalculateResponse(BaseModel):
    product_name: str
    total_co2: float
    breakdown: CarbonBreakdown
    equivalent: CarbonEquivalent


class GlobalStats(BaseModel):
    total_products: int
    avg_gwp: float
    top_category: Optional[str] = None
    most_polluting_product: Optional[ProductOut] = None


class VmStatus(BaseModel):
    id: str
    name: str
    status: str
    cpu_percent: float
    memory_percent: float


class InfrastructureStatus(BaseModel):
    total_vms: int
    running_vms: int
    suspended_vms: int
    active_containers: int
    deployed_apps: int
    status: str


class LogEntry(BaseModel):
    timestamp: str
    level: str
    source: str
    message: str
