import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ProductsApiService } from '../../shared/services/products-api.service';
import { Product, ProductFilter, ProductFiltersResponse, PaginatedProductsResponse } from '../../shared/models/product.model';

type LoadingState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="p-6 lg:p-8 max-w-7xl mx-auto animate-enter min-h-screen">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/>
            </svg>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Catalogue Produits</h1>
            <p class="text-gray-600 mt-1">Explorez l'empreinte carbone des équipements IT avec les données Boavizta</p>
          </div>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <!-- Search -->
          <div class="lg:col-span-2 xl:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                type="text"
                [(ngModel)]="filters.search"
                (ngModelChange)="onSearchChange($event)"
                placeholder="Rechercher par nom, fabricant..."
                class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
              />
            </div>
          </div>

          <!-- Manufacturer Filter -->
          <div class="lg:col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">Fabricant</label>
            <select
              [(ngModel)]="filters.manufacturer"
              (ngModelChange)="applyFilters()"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
            >
              <option value="">Tous</option>
              <option *ngFor="let m of filterOptions.manufacturers" [value]="m">{{m}}</option>
            </select>
          </div>

          <!-- Category Filter -->
          <div class="lg:col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
            <select
              [(ngModel)]="filters.category"
              (ngModelChange)="onCategoryChange()"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
            >
              <option value="">Toutes</option>
              <option *ngFor="let c of filterOptions.categories" [value]="c">{{c}}</option>
            </select>
          </div>

          <!-- Subcategory Filter -->
          <div class="lg:col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              [(ngModel)]="filters.subcategory"
              (ngModelChange)="applyFilters()"
              [disabled]="!filters.category"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">Tous</option>
              <option *ngFor="let s of availableSubcategories" [value]="s">{{s}}</option>
            </select>
          </div>

          <!-- Location Filter -->
          <div class="lg:col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">Zone</label>
            <select
              [(ngModel)]="filters.use_location"
              (ngModelChange)="applyFilters()"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
            >
              <option value="">Toutes</option>
              <option *ngFor="let l of filterOptions.use_locations" [value]="l">{{l}}</option>
            </select>
          </div>
        </div>

        <!-- Active Filters & Sort -->
        <div class="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-100">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm text-gray-500">Filtres:</span>
            <ng-container *ngFor="let filter of activeFilters">
              <button
                (click)="clearFilter(filter.key)"
                class="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm hover:bg-primary-100 transition-colors border border-primary-200"
              >
                <span class="font-medium">{{filter.label}}:</span> {{filter.value}}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </ng-container>
            <button
              *ngIf="activeFilters.length > 0"
              (click)="clearAllFilters()"
              class="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              Tout effacer
            </button>
          </div>

          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500">Trier par:</span>
            <select
              [(ngModel)]="filters.sort"
              (ngModelChange)="applyFilters()"
              class="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="gwp_total">Empreinte carbone</option>
              <option value="report_date">Date rapport</option>
              <option value="manufacturer">Fabricant</option>
              <option value="name">Nom</option>
            </select>
            <button
              (click)="toggleOrder()"
              class="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              [title]="filters.order === 'asc' ? 'Croissant' : 'Décroissant'"
            >
              <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path *ngIf="filters.order === 'asc'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/>
                <path *ngIf="filters.order === 'desc'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Results Count & Stats -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <p class="text-gray-600">
            <span class="font-semibold text-gray-900">{{totalProducts}}</span> produit{{totalProducts !== 1 ? 's' : ''}}
          </p>
          <span *ngIf="loadingState === 'loading'" class="flex items-center gap-2 text-sm text-gray-500">
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Chargement...
          </span>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loadingState === 'loading'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let i of [1,2,3,4,5,6]" class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="h-48 bg-gray-200 animate-pulse"></div>
          <div class="p-6 space-y-4">
            <div class="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div class="h-6 bg-gray-200 rounded animate-pulse w-1/2"></div>
            <div class="h-2 bg-gray-200 rounded animate-pulse"></div>
            <div class="flex gap-2">
              <div class="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
              <div class="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="loadingState === 'error'" class="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-red-900 mb-2">Erreur de chargement</h3>
        <p class="text-red-700 mb-4">{{errorMessage}}</p>
        <button
          (click)="loadProducts()"
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Réessayer
        </button>
      </div>

      <!-- Products Grid -->
      <div *ngIf="loadingState === 'success'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          *ngFor="let product of products; trackBy: trackByProductId"
          [routerLink]="['/client/product', product.id]"
          class="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
        >
          <!-- Product Image/Header -->
          <div class="h-40 bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
            <img 
              [src]="getProductImage(product)" 
              [alt]="product.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              (error)="onImageError($event)"
            />
            <div class="absolute top-3 right-3">
              <span 
                class="px-2 py-1 rounded-full text-xs font-medium"
                [class]="getCategoryBadgeClass(product.category)"
              >
                {{product.category}}
              </span>
            </div>
          </div>

          <!-- Product Info -->
          <div class="p-5 flex-1 flex flex-col">
            <div class="mb-4">
              <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">{{product.manufacturer}}</p>
              <h3 class="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors text-lg">
                {{product.name}}
              </h3>
            </div>

            <!-- GWP Score -->
            <div class="mb-4">
              <div class="flex items-baseline gap-2 mb-2">
                <span class="text-2xl font-bold text-gray-900">{{product.gwp_total | number:'1.0-1'}}</span>
                <span class="text-sm text-gray-500">kgCO₂eq</span>
              </div>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  [class.bg-emerald-500]="product.gwp_total < 200"
                  [class.bg-amber-500]="product.gwp_total >= 200 && product.gwp_total < 500"
                  [class.bg-red-500]="product.gwp_total >= 500"
                  [style.width.%]="Math.min((product.gwp_total / 2000) * 100, 100)"
                ></div>
              </div>
            </div>

            <!-- Specs -->
            <div class="flex flex-wrap gap-2 mb-4">
              <span *ngIf="product.screen_size" class="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">
                {{product.screen_size}}"
              </span>
              <span *ngIf="product.memory" class="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">
                {{product.memory}}GB RAM
              </span>
              <span *ngIf="product.hard_drive" class="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">
                {{formatStorage(product.hard_drive)}}
              </span>
              <span *ngIf="product.yearly_tec" class="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs">
                {{product.yearly_tec}} kWh/an
              </span>
            </div>

            <!-- Footer -->
            <div class="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
              <div class="flex items-center gap-2 text-sm text-gray-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>{{product.lifetime}} ans</span>
              </div>
              <div class="flex items-center gap-1 text-primary-600 group-hover:translate-x-1 transition-transform">
                <span class="text-sm font-medium">Détails</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="loadingState === 'success' && products.length === 0" class="text-center py-16">
        <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Aucun produit trouvé</h3>
        <p class="text-gray-600 mb-4">Essayez d'ajuster vos critères de recherche</p>
        <button
          (click)="clearAllFilters()"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Réinitialiser les filtres
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class ClientDashboardComponent implements OnInit, OnDestroy {
  // Data
  products: Product[] = [];
  totalProducts = 0;
  filterOptions: ProductFiltersResponse = {
    manufacturers: [],
    categories: [],
    subcategories: [],
    use_locations: [],
    years: []
  };

  // Filters
  filters: ProductFilter = {
    search: '',
    manufacturer: '',
    category: '',
    subcategory: '',
    use_location: '',
    sort: 'gwp_total',
    order: 'asc',
    page: 1,
    limit: 20
  };

  // State
  loadingState: LoadingState = 'idle';
  errorMessage = '';

  // Subcategories filtered by selected category
  availableSubcategories: string[] = [];

  // Search debounce
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  Math = Math;

  constructor(private productsApi: ProductsApiService) {}

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadFilterOptions();
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  loadProducts(): void {
    this.loadingState = 'loading';

    this.productsApi.getProducts(this.filters).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: PaginatedProductsResponse) => {
        this.products = response.data;
        this.totalProducts = response.total;
        this.loadingState = 'success';
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.errorMessage = 'Impossible de charger les produits. Veuillez réessayer.';
        this.loadingState = 'error';
      }
    });
  }

  loadFilterOptions(): void {
    this.productsApi.getFilterOptions().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (options) => {
        this.filterOptions = options;
      },
      error: () => {
        // Fallback handled in service
      }
    });
  }

  onSearchChange(value: string): void {
    this.filters.search = value;
    this.searchSubject.next(value);
  }

  onCategoryChange(): void {
    this.filters.subcategory = '';
    this.availableSubcategories = this.getSubcategoriesForCategory(this.filters.category || '');
    this.applyFilters();
  }

  applyFilters(): void {
    this.filters.page = 1;
    // In a real implementation, this would call the API with filters
    // For now, client-side filtering on mock data
    this.loadProducts();
  }

  toggleOrder(): void {
    this.filters.order = this.filters.order === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  clearFilter(key: keyof ProductFilter): void {
    (this.filters as any)[key] = '';
    if (key === 'category') {
      this.filters.subcategory = '';
      this.availableSubcategories = [];
    }
    this.applyFilters();
  }

  clearAllFilters(): void {
    this.filters = {
      search: '',
      manufacturer: '',
      category: '',
      subcategory: '',
      use_location: '',
      sort: 'gwp_total',
      order: 'asc',
      page: 1,
      limit: 20
    };
    this.availableSubcategories = [];
    this.applyFilters();
  }

  get activeFilters(): { key: keyof ProductFilter; label: string; value: string }[] {
    const filters: { key: keyof ProductFilter; label: string; value: string }[] = [];

    if (this.filters.search) {
      filters.push({ key: 'search', label: 'Recherche', value: this.filters.search });
    }
    if (this.filters.manufacturer) {
      filters.push({ key: 'manufacturer', label: 'Fabricant', value: this.filters.manufacturer });
    }
    if (this.filters.category) {
      filters.push({ key: 'category', label: 'Catégorie', value: this.filters.category });
    }
    if (this.filters.subcategory) {
      filters.push({ key: 'subcategory', label: 'Type', value: this.filters.subcategory });
    }
    if (this.filters.use_location) {
      filters.push({ key: 'use_location', label: 'Zone', value: this.filters.use_location });
    }

    return filters;
  }

  getCategoryBadgeClass(category: string): string {
    switch (category) {
      case 'Workplace':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'Datacenter':
        return 'bg-purple-100 text-purple-700 border border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  }

  formatStorage(gb: number): string {
    if (gb >= 1000) {
      return `${(gb / 1000).toFixed(1)}TB`;
    }
    return `${gb}GB`;
  }

  trackByProductId(index: number, product: Product): string {
    return product.id || `product-${index}`;
  }

  getProductImage(product: Product): string {
    const manufacturer = product.manufacturer.toLowerCase();
    const subcategory = product.subcategory.toLowerCase();
    
    // Apple products
    if (manufacturer.includes('apple')) {
      if (subcategory.includes('macbook') || subcategory.includes('laptop')) {
        return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop&auto=format';
      }
      if (subcategory.includes('iphone') || subcategory.includes('smartphone')) {
        return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop&auto=format';
      }
      if (subcategory.includes('ipad') || subcategory.includes('tablet')) {
        return 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop&auto=format';
      }
      if (subcategory.includes('imac') || subcategory.includes('desktop')) {
        return 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop&auto=format';
      }
    }
    
    // Dell products
    if (manufacturer.includes('dell')) {
      if (subcategory.includes('laptop')) {
        return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop&auto=format';
      }
      if (subcategory.includes('server')) {
        return 'https://images.unsplash.com/photo-1558494949-ef010cbcc31a?w=400&h=300&fit=crop&auto=format';
      }
    }
    
    // HP products
    if (manufacturer.includes('hp')) {
      if (subcategory.includes('laptop')) {
        return 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=400&h=300&fit=crop&auto=format';
      }
    }
    
    // Lenovo products
    if (manufacturer.includes('lenovo')) {
      if (subcategory.includes('laptop')) {
        return 'https://images.unsplash.com/photo-1593696140826-c58b021acf8b?w=400&h=300&fit=crop&auto=format';
      }
    }
    
    // Server/Network equipment
    if (subcategory.includes('server') || subcategory.includes('switch') || subcategory.includes('storage')) {
      return 'https://images.unsplash.com/photo-1558494949-ef010cbcc31a?w=400&h=300&fit=crop&auto=format';
    }
    
    // Default tech image
    return 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop&auto=format';
  }

  onImageError(event: any): void {
    // Fallback to a generic tech image if the specific one fails
    event.target.src = 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop&auto=format';
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  private getSubcategoriesForCategory(category: string): string[] {
    if (!category) return [];
    // This would ideally come from the backend based on category
    const subcategoriesMap: Record<string, string[]> = {
      'Workplace': ['Laptop', 'Desktop', 'Monitor', 'Tablet', 'Smartphone'],
      'Datacenter': ['Server', 'Hard drive', 'Network switch']
    };
    return subcategoriesMap[category] || [];
  }
}
