import os
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.database import SessionLocal
from app.models import Product
from app.utils import slugify, safe_float, year_from_date


def seed_products_from_csv(csv_path: str = "boavizta-data-fr.csv"):
    db = SessionLocal()
    try:
        count = db.execute(select(func.count()).select_from(Product)).scalar()
        if count > 0:
            print(f"Table already contains {count} products, skipping CSV import")
            return

        if not os.path.exists(csv_path):
            print(f"CSV file not found: {csv_path}")
            return

        print(f"Importing CSV: {csv_path}")
        df = pd.read_csv(csv_path, sep=";")
        print(f"Found {len(df)} rows in CSV")

        df = df.drop_duplicates(subset=["name"], keep="first")
        print(f"After deduplication: {len(df)} rows")

        products_added = 0
        for _, row in df.iterrows():
            try:
                slug = slugify(str(row.get("name", "")))
                if not slug:
                    continue

                existing = db.execute(
                    select(Product).where(Product.slug == slug)
                ).scalar_one_or_none()
                if existing:
                    slug = f"{slug}-{products_added}"

                product = Product(
                    manufacturer=row.get("manufacturer"),
                    name=row.get("name"),
                    slug=slug,
                    category=row.get("category"),
                    subcategory=row.get("subcategory"),
                    gwp_total=safe_float(row.get("gwp_total")),
                    gwp_use_ratio=safe_float(row.get("gwp_use_ratio")),
                    yearly_tec=safe_float(row.get("yearly_tec")),
                    lifetime=safe_float(row.get("lifetime")),
                    use_location=row.get("use_location"),
                    report_date=row.get("report_date"),
                    sources=row.get("sources"),
                    sources_hash=row.get("sources_hash"),
                    gwp_error_ratio=safe_float(row.get("gwp_error_ratio")),
                    gwp_manufacturing_ratio=safe_float(row.get("gwp_manufacturing_ratio")),
                    weight=safe_float(row.get("weight")),
                    assembly_location=row.get("assembly_location"),
                    screen_size=safe_float(row.get("screen_size")),
                    server_type=row.get("server_type"),
                    hard_drive=row.get("hard_drive"),
                    memory=safe_float(row.get("memory")),
                    number_cpu=safe_float(row.get("number_cpu")),
                    height=safe_float(row.get("height")),
                    added_date=row.get("added_date"),
                    add_method=row.get("add_method"),
                    gwp_transport_ratio=safe_float(row.get("gwp_transport_ratio")),
                    gwp_eol_ratio=safe_float(row.get("gwp_eol_ratio")),
                    gwp_electronics_ratio=safe_float(row.get("gwp_electronics_ratio")),
                    gwp_battery_ratio=safe_float(row.get("gwp_battery_ratio")),
                    gwp_hdd_ratio=safe_float(row.get("gwp_hdd_ratio")),
                    gwp_ssd_ratio=safe_float(row.get("gwp_ssd_ratio")),
                    gwp_othercomponents_ratio=safe_float(row.get("gwp_othercomponents_ratio")),
                )
                db.add(product)
                products_added += 1

                if products_added % 100 == 0:
                    db.commit()
                    print(f"  ... {products_added} products added")

            except Exception as e:
                print(f"Error processing row: {e}")
                continue

        db.commit()
        print(f"Successfully imported {products_added} products")

    except Exception as e:
        print(f"Error importing CSV: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_products_from_csv()
