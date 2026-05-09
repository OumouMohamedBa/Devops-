from sqlalchemy import Column, String, Index
from app.database import Base


class Product(Base):
    __tablename__ = "boavizta_data"

    manufacturer = Column(String)
    name = Column(String, primary_key=True)
    category = Column(String)
    subcategory = Column(String)
    gwp_total = Column(String)
    gwp_use_ratio = Column(String)
    yearly_tec = Column(String)
    lifetime = Column(String)
    use_location = Column(String)
    report_date = Column(String)
    sources = Column(String)
    sources_hash = Column(String)
    gwp_error_ratio = Column(String)
    gwp_manufacturing_ratio = Column(String)
    weight = Column(String)
    assembly_location = Column(String)
    screen_size = Column(String)
    server_type = Column(String)
    hard_drive = Column(String)
    memory = Column(String)
    number_cpu = Column(String)
    height = Column(String)
    added_date = Column(String)
    add_method = Column(String)
    gwp_transport_ratio = Column(String)
    gwp_eol_ratio = Column(String)
    gwp_electronics_ratio = Column(String)
    gwp_battery_ratio = Column(String)
    gwp_hdd_ratio = Column(String)
    gwp_ssd_ratio = Column(String)
    gwp_othercomponents_ratio = Column(String)
    comment = Column(String)

    __table_args__ = (
        Index("idx_manufacturer", "manufacturer"),
        Index("idx_category", "category"),
        Index("idx_subcategory", "subcategory"),
        Index("idx_location", "use_location"),
    )
