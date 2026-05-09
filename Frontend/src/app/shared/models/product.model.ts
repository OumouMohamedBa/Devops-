// ============================================================================
// PRODUCT MODELS - Aligned with Backend API / PostgreSQL Schema
// Based on Boavizta CSV structure
// ============================================================================

export interface Product {
  // Identity
  id: string; // Generated in service from product name
  manufacturer: string;
  name: string;
  category: string;
  subcategory: string;

  // Carbon Score - Backend returns strings, convert to numbers
  gwp_total: number;

  // Lifecycle Breakdown (ratios 0-1 or 0-100) - Backend returns strings
  gwp_manufacturing_ratio: number;
  gwp_use_ratio: number;
  gwp_transport_ratio: number;
  gwp_eol_ratio: number;

  // Component Breakdown (optional, may be null) - Backend returns strings
  gwp_electronics_ratio?: number | null;
  gwp_battery_ratio?: number | null;
  gwp_hdd_ratio?: number | null;
  gwp_ssd_ratio?: number | null;
  gwp_othercomponents_ratio?: number | null;

  // Usage & Lifetime - Backend returns strings
  yearly_tec: number;
  lifetime: number;
  use_location: string;

  // Metadata
  report_date: string;
  sources: string;
  sources_hash: string;
  added_date?: string;
  add_method?: string;

  // Error margin - Backend returns strings
  gwp_error_ratio?: number | null;

  // Technical Specs (all optional, varies by product type) - Backend returns strings
  weight?: number | null;
  screen_size?: number | null;
  memory?: number | null;
  hard_drive?: number | null;
  number_cpu?: number | null;
  height?: number | null;
  server_type?: string | null;
  assembly_location?: string | null;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface ProductFilter {
  manufacturer?: string;
  category?: string;
  subcategory?: string;
  use_location?: string;
  search?: string;
  sort?: 'gwp_total' | 'report_date' | 'manufacturer' | 'name';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ProductFiltersResponse {
  manufacturers: string[];
  categories: string[];
  subcategories: string[];
  use_locations: string[];
  years: number[];
}

// ============================================================================
// CARBON CALCULATION
// ============================================================================

export interface CarbonCalculationRequest {
  product_id: string;
  usage_years: number;
  location: string;
  daily_usage_hours?: number;
}

export interface CarbonCalculationResponse {
  product_id: string;
  product_name: string;
  base_gwp: number;
  calculated_gwp: number;
  usage_contribution: number;
  usage_years: number;
  location: string;
  location_carbon_intensity: number;
  equivalents: {
    km_car: number;
    km_train: number;
    kwh_electricity: number;
    tree_months: number;
  };
  comparison_text: string;
}

// ============================================================================
// UI DISPLAY MODELS (derived from Product for presentation)
// ============================================================================

export interface ProductCardDisplay {
  id: string;
  manufacturer: string;
  name: string;
  category: string;
  subcategory: string;
  gwp_total: number;
  badge_color: string;
  key_specs: string[];
  has_image: boolean;
}

export interface LifecycleBreakdown {
  manufacturing: { value: number; percentage: number; color: string };
  use: { value: number; percentage: number; color: string };
  transport: { value: number; percentage: number; color: string };
  eol: { value: number; percentage: number; color: string };
}

export interface ComponentBreakdown {
  electronics?: { percentage: number | null; color: string };
  battery?: { percentage: number | null; color: string };
  hdd?: { percentage: number | null; color: string };
  ssd?: { percentage: number | null; color: string };
  screen?: { percentage: number | null; color: string };
  chassis?: { percentage: number | null; color: string };
  other?: { percentage: number | null; color: string };
}
