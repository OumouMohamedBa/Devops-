import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, map } from 'rxjs';
import { ApiService } from './api.service';
import {
  Product,
  ProductFilter,
  PaginatedProductsResponse,
  ProductFiltersResponse,
  CarbonCalculationRequest,
  CarbonCalculationResponse
} from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductsApiService extends ApiService {

  // ============================================================================
  // PRODUCTS CRUD
  // ============================================================================

  getProducts(filter?: ProductFilter): Observable<PaginatedProductsResponse> {
    return this.get<any>('/products', filter).pipe(
      map(response => this.mapApiResponse(response))
    );
  }

  private mapApiResponse(response: any): PaginatedProductsResponse {
    return {
      data: response.items.map((item: any) => this.mapProduct(item)),
      total: response.total,
      page: response.page || 1,
      limit: response.page_size || 20,
      total_pages: Math.ceil(response.total / (response.page_size || 20))
    };
  }

  private mapProduct(item: any): Product {
    return {
      id: item.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      manufacturer: item.manufacturer || '',
      name: item.name || '',
      category: item.category || '',
      subcategory: item.subcategory || '',
      
      // Convert string numbers to actual numbers
      gwp_total: this.parseNumber(item.gwp_total),
      gwp_manufacturing_ratio: this.parseNumber(item.gwp_manufacturing_ratio),
      gwp_use_ratio: this.parseNumber(item.gwp_use_ratio),
      gwp_transport_ratio: this.parseNumber(item.gwp_transport_ratio),
      gwp_eol_ratio: this.parseNumber(item.gwp_eol_ratio),
      
      gwp_electronics_ratio: this.parseNullableNumber(item.gwp_electronics_ratio),
      gwp_battery_ratio: this.parseNullableNumber(item.gwp_battery_ratio),
      gwp_hdd_ratio: this.parseNullableNumber(item.gwp_hdd_ratio),
      gwp_ssd_ratio: this.parseNullableNumber(item.gwp_ssd_ratio),
      gwp_othercomponents_ratio: this.parseNullableNumber(item.gwp_othercomponents_ratio),
      
      yearly_tec: this.parseNumber(item.yearly_tec),
      lifetime: this.parseNumber(item.lifetime),
      use_location: item.use_location || '',
      
      report_date: item.report_date || '',
      sources: item.sources || '',
      sources_hash: item.sources_hash || '',
      added_date: item.added_date,
      add_method: item.add_method,
      
      gwp_error_ratio: this.parseNullableNumber(item.gwp_error_ratio),
      
      weight: this.parseNullableNumber(item.weight),
      screen_size: this.parseNullableNumber(item.screen_size),
      memory: this.parseNullableNumber(item.memory),
      hard_drive: this.parseNullableNumber(item.hard_drive),
      number_cpu: this.parseNullableNumber(item.number_cpu),
      height: this.parseNullableNumber(item.height),
      server_type: item.server_type,
      assembly_location: item.assembly_location
    };
  }

  private parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Handle comma decimal separator
      const cleaned = value.replace(',', '.');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  private parseNullableNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    return this.parseNumber(value);
  }

  getProductById(id: string): Observable<Product | null> {
    // Backend doesn't have ID-based endpoint, search by name instead
    const searchTerms = id.replace(/-/g, ' ').toLowerCase().split(' ').filter(term => term.length > 2);
    
    return this.get<any>('/products').pipe(
      map(response => {
        const products = response.items || [];
        
        // First try exact ID match
        let product = products.find((p: any) => 
          p.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === id.toLowerCase()
        );
        
        // If not found, try partial matching
        if (!product && searchTerms.length > 0) {
          product = products.find((p: any) => {
            const productName = p.name?.toLowerCase() || '';
            return searchTerms.every(term => productName.includes(term));
          });
        }
        
        // If still not found, try looser matching
        if (!product && searchTerms.length > 0) {
          product = products.find((p: any) => {
            const productName = p.name?.toLowerCase() || '';
            return searchTerms.some(term => productName.includes(term));
          });
        }
        
        return product ? this.mapProduct(product) : null;
      })
    );
  }

  searchProducts(query: string, page: number = 1, limit: number = 20): Observable<PaginatedProductsResponse> {
    return this.get<PaginatedProductsResponse>('/products', {
      search: query,
      page,
      limit
    });
  }

  // ============================================================================
  // FILTER OPTIONS
  // ============================================================================

  getFilterOptions(): Observable<ProductFiltersResponse> {
    return this.get<ProductFiltersResponse>('/filters');
  }

  // ============================================================================
  // CARBON CALCULATION
  // ============================================================================

  calculateCarbon(request: CarbonCalculationRequest): Observable<CarbonCalculationResponse> {
    return this.post<CarbonCalculationResponse>('/carbon/calculate', request);
  }

  // ============================================================================
  // STATS
  // ============================================================================

  getProductStats(): Observable<{
    total_products: number;
    by_category: Record<string, number>;
    by_manufacturer: Record<string, number>;
    avg_gwp_by_category: Record<string, number>;
  }> {
    return this.get('/stats/products');
  }

  // ============================================================================
  // FALLBACK MOCK (for development/demo when API is unavailable)
  // ============================================================================

  private readonly mockProducts: Product[] = [
    {
      id: 'seagate-nytro-3331',
      manufacturer: 'Seagate',
      name: 'Nytro 3331 7.68TB',
      category: 'Datacenter',
      subcategory: 'Hard drive',
      gwp_total: 195.072,
      gwp_manufacturing_ratio: 77.9,
      gwp_use_ratio: 15.0,
      gwp_transport_ratio: 5.0,
      gwp_eol_ratio: 2.1,
      yearly_tec: 12.5,
      lifetime: 5,
      use_location: 'WW',
      report_date: '2023-01-15',
      sources: 'https://www.seagate.com/files/content/docs/product-flyers/nytro-3331-sas-ssd-flyer.pdf',
      sources_hash: 'abc123',
      hard_drive: 7680,
      assembly_location: 'CN'
    },
    {
      id: 'apple-macbook-air-m1',
      manufacturer: 'Apple',
      name: 'MacBook Air M1 13-inch',
      category: 'Workplace',
      subcategory: 'Laptop',
      gwp_total: 161,
      gwp_manufacturing_ratio: 76.0,
      gwp_use_ratio: 15.0,
      gwp_transport_ratio: 6.0,
      gwp_eol_ratio: 3.0,
      gwp_electronics_ratio: 45.0,
      gwp_battery_ratio: 12.0,
      yearly_tec: 22.0,
      lifetime: 3,
      use_location: 'WW',
      report_date: '2020-11-10',
      sources: 'https://www.apple.com/environment/pdf/products/notebooks/13-inch_MacBookAir_PER_Nov2020.pdf',
      sources_hash: 'def456',
      weight: 1.29,
      screen_size: 13.3,
      memory: 8,
      assembly_location: 'CN'
    },
    {
      id: 'dell-poweredge-r740',
      manufacturer: 'Dell',
      name: 'PowerEdge R740',
      category: 'Datacenter',
      subcategory: 'Server',
      gwp_total: 1850,
      gwp_manufacturing_ratio: 70.0,
      gwp_use_ratio: 25.0,
      gwp_transport_ratio: 3.0,
      gwp_eol_ratio: 2.0,
      gwp_electronics_ratio: 35.0,
      yearly_tec: 450.0,
      lifetime: 5,
      use_location: 'WW',
      report_date: '2021-03-15',
      sources: 'https://www.delltechnologies.com/asset/en-us/products/servers/technical-support/poweredge-r740-spec-sheet.pdf',
      sources_hash: 'ghi789',
      memory: 64,
      number_cpu: 2,
      server_type: 'rack',
      height: 2,
      assembly_location: 'US'
    },
    {
      id: 'lenovo-thinkpad-x1',
      manufacturer: 'Lenovo',
      name: 'ThinkPad X1 Carbon Gen 9',
      category: 'Workplace',
      subcategory: 'Laptop',
      gwp_total: 280,
      gwp_manufacturing_ratio: 70.0,
      gwp_use_ratio: 25.0,
      gwp_transport_ratio: 3.5,
      gwp_eol_ratio: 1.5,
      gwp_electronics_ratio: 40.0,
      gwp_battery_ratio: 15.0,
      yearly_tec: 35.0,
      lifetime: 4,
      use_location: 'WW',
      report_date: '2021-06-20',
      sources: 'https://www.lenovo.com/us/en/compliance/eco-declaration',
      sources_hash: 'jkl012',
      weight: 1.13,
      screen_size: 14.0,
      memory: 16,
      assembly_location: 'CN'
    },
    {
      id: 'hp-elitedesk-800',
      manufacturer: 'HP',
      name: 'EliteDesk 800 G6 Desktop',
      category: 'Workplace',
      subcategory: 'Desktop',
      gwp_total: 340,
      gwp_manufacturing_ratio: 70.0,
      gwp_use_ratio: 25.0,
      gwp_transport_ratio: 3.0,
      gwp_eol_ratio: 2.0,
      gwp_electronics_ratio: 38.0,
      yearly_tec: 65.0,
      lifetime: 4,
      use_location: 'WW',
      report_date: '2020-09-10',
      sources: 'https://www.hp.com/us-en/sustainable-impact/eco-labels.html',
      sources_hash: 'mno345',
      memory: 16,
      hard_drive: 256,
      assembly_location: 'CN'
    },
    {
      id: 'dell-ultrasharp-u2720q',
      manufacturer: 'Dell',
      name: 'UltraSharp U2720Q',
      category: 'Workplace',
      subcategory: 'Monitor',
      gwp_total: 180,
      gwp_manufacturing_ratio: 70.0,
      gwp_use_ratio: 25.0,
      gwp_transport_ratio: 3.0,
      gwp_eol_ratio: 2.0,
      gwp_electronics_ratio: 60.0,
      yearly_tec: 55.0,
      lifetime: 5,
      use_location: 'WW',
      report_date: '2020-02-15',
      sources: 'https://www.dell.com/support/manuals/fr-fr/dell-u2720q-monitor',
      sources_hash: 'pqr678',
      screen_size: 27.0,
      assembly_location: 'CN'
    }
  ];

  getMockProducts(): Observable<PaginatedProductsResponse> {
    return of({
      data: this.mockProducts,
      total: this.mockProducts.length,
      page: 1,
      limit: this.mockProducts.length,
      total_pages: 1
    });
  }

  getMockProductById(id: string): Observable<Product | null> {
    const product = this.mockProducts.find(p => p.id === id) || null;
    return of(product);
  }

  getMockFilterOptions(): Observable<ProductFiltersResponse> {
    return of({
      manufacturers: [...new Set(this.mockProducts.map(p => p.manufacturer))],
      categories: [...new Set(this.mockProducts.map(p => p.category))],
      subcategories: [...new Set(this.mockProducts.map(p => p.subcategory))],
      use_locations: [...new Set(this.mockProducts.map(p => p.use_location))],
      years: [...new Set(this.mockProducts.map(p => new Date(p.report_date).getFullYear()))].sort((a, b) => b - a)
    });
  }
}
