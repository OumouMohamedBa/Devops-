import re
import unicodedata


CARBON_INTENSITIES = {
    "WW": 475.0,
    "EU": 230.0,
    "US": 390.0,
    "FR": 60.0,
    "CN": 650.0,
}


def slugify(value: str) -> str:
    if not value:
        return ""
    value = unicodedata.normalize('NFKD', value)
    value = value.encode('ascii', 'ignore').decode('ascii')
    value = re.sub(r'[^\w\s-]', '', value.lower())
    value = re.sub(r'[-\s]+', '-', value).strip('-_')
    return value


def safe_float(value):
    if value is None:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def year_from_date(date_str: str) -> int:
    if not date_str:
        return None
    try:
        parts = date_str.split('/')
        if len(parts) == 3:
            return int(parts[2])
        elif len(parts) == 1 and date_str.isdigit():
            return int(date_str)
    except (ValueError, AttributeError):
        pass
    return None


def carbon_intensity_for_location(location: str) -> float:
    if not location:
        return CARBON_INTENSITIES["WW"]
    location_upper = location.upper()
    return CARBON_INTENSITIES.get(location_upper, CARBON_INTENSITIES["WW"])
