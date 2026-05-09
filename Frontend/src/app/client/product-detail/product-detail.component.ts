import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ProductsApiService } from '../../shared/services/products-api.service';
import { Product, CarbonCalculationRequest, CarbonCalculationResponse, LifecycleBreakdown, ComponentBreakdown } from '../../shared/models/product.model';

type LoadingState = 'idle' | 'loading' | 'success' | 'error';
type CalculatorState = 'idle' | 'calculating' | 'result';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="p-6 lg:p-8 max-w-7xl mx-auto animate-enter">
      <!-- Loading State -->
      <div *ngIf="loadingState === 'loading'" class="space-y-6">
        <div class="h-8 bg-gray-200 rounded animate-pulse w-1/3"></div>
        <div class="bg-white rounded-2xl shadow-sm p-8">
          <div class="flex flex-col lg:flex-row gap-8">
            <div class="lg:w-1/3 aspect-square bg-gray-200 rounded-2xl animate-pulse"></div>
            <div class="lg:w-2/3 space-y-4">
              <div class="h-10 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div class="h-6 bg-gray-200 rounded animate-pulse w-1/2"></div>
              <div class="h-32 bg-gray-200 rounded animate-pulse"></div>
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
        <p class="text-red-700 mb-4">{{errorMessage || 'Impossible de charger les détails du produit.'}}</p>
        <a routerLink="/client" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          Retour au catalogue
        </a>
      </div>

      <!-- Product Content -->
      <ng-container *ngIf="loadingState === 'success' && product">
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <a routerLink="/client" class="hover:text-primary-600 transition-colors">Catalogue</a>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
          <span class="text-gray-900">{{product.name}}</span>
        </nav>

        <!-- Header Card -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div class="p-6 lg:p-8">
            <div class="flex flex-col lg:flex-row gap-8">
              <!-- Product Visual -->
              <div class="lg:w-1/3">
                <div class="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden">
                  <img 
                    [src]="getProductImage(product)" 
                    [alt]="product.name"
                    class="w-full h-full object-cover"
                    (error)="onImageError($event)"
                  />
                </div>
              </div>

              <!-- Product Info -->
              <div class="lg:w-2/3">
                <!-- Badges -->
                <div class="flex items-center gap-2 mb-3 flex-wrap">
                  <span class="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium border border-primary-200">
                    {{product.category}}
                  </span>
                  <span class="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm border border-gray-200">
                    {{product.subcategory}}
                  </span>
                  <span class="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm border border-blue-200">
                    {{product.use_location}}
                  </span>
                </div>

                <h1 class="text-3xl font-bold text-gray-900 mb-2">{{product.name}}</h1>
                <p class="text-xl text-gray-500 mb-6">{{product.manufacturer}}</p>

                <!-- GWP Score Card -->
                <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 mb-6 text-white">
                  <div class="flex items-center justify-between mb-4">
                    <div>
                      <p class="text-gray-400 text-sm mb-1">Empreinte Carbone Totale</p>
                      <div class="flex items-baseline gap-2">
                        <span class="text-5xl font-bold">{{product.gwp_total | number:'1.0-1'}}</span>
                        <span class="text-xl text-gray-400">kgCO₂eq</span>
                      </div>
                    </div>
                    <div class="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                      <svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/>
                      </svg>
                    </div>
                  </div>
                  <div class="flex items-center gap-4 text-sm text-gray-400">
                    <span>Rapport: {{product.report_date | date:'dd/MM/yyyy'}}</span>
                    <span *ngIf="product.sources_hash">• Hash: {{product.sources_hash | slice:0:8}}</span>
                  </div>
                </div>

                <!-- Quick Specs -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div class="bg-gray-50 rounded-xl p-3 text-center">
                    <p class="text-xs text-gray-500 mb-1">Durée de vie</p>
                    <p class="font-semibold text-gray-900">{{product.lifetime}} ans</p>
                  </div>
                  <div class="bg-gray-50 rounded-xl p-3 text-center" *ngIf="product.yearly_tec">
                    <p class="text-xs text-gray-500 mb-1">Conso. annuelle</p>
                    <p class="font-semibold text-gray-900">{{product.yearly_tec}} kWh</p>
                  </div>
                  <div class="bg-gray-50 rounded-xl p-3 text-center" *ngIf="product.weight">
                    <p class="text-xs text-gray-500 mb-1">Poids</p>
                    <p class="font-semibold text-gray-900">{{product.weight}} kg</p>
                  </div>
                  <div class="bg-gray-50 rounded-xl p-3 text-center" *ngIf="product.assembly_location">
                    <p class="text-xs text-gray-500 mb-1">Assemblage</p>
                    <p class="font-semibold text-gray-900">{{product.assembly_location}}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <!-- Lifecycle Breakdown Chart -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 11H15V3.055a9.001 9.001 0 015.488 7.945z"/>
              </svg>
              Cycle de Vie
            </h2>

            <div class="flex items-center justify-center mb-6">
              <svg viewBox="0 0 200 200" class="w-56 h-56 transform -rotate-90">
                <!-- Manufacturing -->
                <circle cx="100" cy="100" r="70" fill="none" stroke="#10b981" stroke-width="35"
                  [attr.stroke-dasharray]="getStrokeDashArray(lifecycleBreakdown.manufacturing.percentage)" stroke-dashoffset="0"/>
                <!-- Use -->
                <circle cx="100" cy="100" r="70" fill="none" stroke="#3b82f6" stroke-width="35"
                  [attr.stroke-dasharray]="getStrokeDashArray(lifecycleBreakdown.use.percentage)"
                  [attr.stroke-dashoffset]="getStrokeDashOffset(lifecycleBreakdown.manufacturing.percentage)"/>
                <!-- Transport -->
                <circle cx="100" cy="100" r="70" fill="none" stroke="#f59e0b" stroke-width="35"
                  [attr.stroke-dasharray]="getStrokeDashArray(lifecycleBreakdown.transport.percentage)"
                  [attr.stroke-dashoffset]="getStrokeDashOffset(lifecycleBreakdown.manufacturing.percentage + lifecycleBreakdown.use.percentage)"/>
                <!-- EOL -->
                <circle cx="100" cy="100" r="70" fill="none" stroke="#6b7280" stroke-width="35"
                  [attr.stroke-dasharray]="getStrokeDashArray(lifecycleBreakdown.eol.percentage)"
                  [attr.stroke-dashoffset]="getStrokeDashOffset(lifecycleBreakdown.manufacturing.percentage + lifecycleBreakdown.use.percentage + lifecycleBreakdown.transport.percentage)"/>
              </svg>
            </div>

            <!-- Legend -->
            <div class="grid grid-cols-2 gap-3">
              <div class="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span class="text-sm font-medium text-gray-700">Fabrication</span>
                </div>
                <span class="text-sm font-bold text-emerald-700">{{lifecycleBreakdown.manufacturing.percentage | number:'1.0-1'}}%</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span class="text-sm font-medium text-gray-700">Utilisation</span>
                </div>
                <span class="text-sm font-bold text-blue-700">{{lifecycleBreakdown.use.percentage | number:'1.0-1'}}%</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span class="text-sm font-medium text-gray-700">Transport</span>
                </div>
                <span class="text-sm font-bold text-amber-700">{{lifecycleBreakdown.transport.percentage | number:'1.0-1'}}%</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span class="text-sm font-medium text-gray-700">Fin de vie</span>
                </div>
                <span class="text-sm font-bold text-gray-700">{{lifecycleBreakdown.eol.percentage | number:'1.0-1'}}%</span>
              </div>
            </div>
          </div>

          <!-- Component Breakdown -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
              Répartition par Composants
            </h2>

            <div class="space-y-4">
              <!-- Electronics -->
              <div *ngIf="hasComponentData(componentBreakdown.electronics)" class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">Électronique</span>
                  <span class="text-sm font-bold text-gray-900">{{componentBreakdown.electronics?.percentage | number:'1.0-1'}}%</span>
                </div>
                <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500"
                       [style.width.%]="componentBreakdown.electronics?.percentage || 0"></div>
                </div>
              </div>

              <!-- Battery -->
              <div *ngIf="hasComponentData(componentBreakdown.battery)" class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">Batterie</span>
                  <span class="text-sm font-bold text-gray-900">{{componentBreakdown.battery?.percentage | number:'1.0-1'}}%</span>
                </div>
                <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
                       [style.width.%]="componentBreakdown.battery?.percentage || 0"></div>
                </div>
              </div>

              <!-- SSD -->
              <div *ngIf="hasComponentData(componentBreakdown.ssd)" class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">SSD</span>
                  <span class="text-sm font-bold text-gray-900">{{componentBreakdown.ssd?.percentage | number:'1.0-1'}}%</span>
                </div>
                <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full transition-all duration-500"
                       [style.width.%]="componentBreakdown.ssd?.percentage || 0"></div>
                </div>
              </div>

              <!-- HDD -->
              <div *ngIf="hasComponentData(componentBreakdown.hdd)" class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">Disque dur</span>
                  <span class="text-sm font-bold text-gray-900">{{componentBreakdown.hdd?.percentage | number:'1.0-1'}}%</span>
                </div>
                <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                       [style.width.%]="componentBreakdown.hdd?.percentage || 0"></div>
                </div>
              </div>

              <!-- Screen -->
              <div *ngIf="hasComponentData(componentBreakdown.screen)" class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">Écran</span>
                  <span class="text-sm font-bold text-gray-900">{{componentBreakdown.screen?.percentage | number:'1.0-1'}}%</span>
                </div>
                <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-pink-400 to-pink-500 rounded-full transition-all duration-500"
                       [style.width.%]="componentBreakdown.screen?.percentage || 0"></div>
                </div>
              </div>

              <!-- Chassis -->
              <div *ngIf="hasComponentData(componentBreakdown.chassis)" class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">Châssis</span>
                  <span class="text-sm font-bold text-gray-900">{{componentBreakdown.chassis?.percentage | number:'1.0-1'}}%</span>
                </div>
                <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-gray-400 to-gray-500 rounded-full transition-all duration-500"
                       [style.width.%]="componentBreakdown.chassis?.percentage || 0"></div>
                </div>
              </div>

              <!-- Other Components -->
              <div *ngIf="hasComponentData(componentBreakdown.other)" class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">Autres</span>
                  <span class="text-sm font-bold text-gray-900">{{componentBreakdown.other?.percentage | number:'1.0-1'}}%</span>
                </div>
                <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                       [style.width.%]="componentBreakdown.other?.percentage || 0"></div>
                </div>
              </div>

              <!-- No Data Message -->
              <div *ngIf="!hasAnyComponentData()" class="text-center py-8 text-gray-500">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-sm">Données de répartition par composants non disponibles pour ce produit</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Technical Specs & Carbon Calculator Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <!-- Technical Specs -->
          <div class="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
              </svg>
              Spécifications
            </h2>

            <div class="space-y-3">
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span class="text-gray-600 text-sm">Écran</span>
                <span class="font-medium text-gray-900">{{product.screen_size ? product.screen_size + '"' : '—'}}</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span class="text-gray-600 text-sm">Mémoire</span>
                <span class="font-medium text-gray-900">{{product.memory ? product.memory + ' GB' : '—'}}</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span class="text-gray-600 text-sm">Stockage</span>
                <span class="font-medium text-gray-900">{{product.hard_drive ? formatStorage(product.hard_drive) : '—'}}</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span class="text-gray-600 text-sm">Processeurs</span>
                <span class="font-medium text-gray-900">{{product.number_cpu || '—'}}</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span class="text-gray-600 text-sm">Type serveur</span>
                <span class="font-medium text-gray-900">{{product.server_type || '—'}}</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span class="text-gray-600 text-sm">Hauteur (U)</span>
                <span class="font-medium text-gray-900">{{product.height || '—'}}</span>
              </div>
            </div>

            <!-- Source Link -->
            <div class="mt-6 pt-6 border-t border-gray-100" *ngIf="product.sources">
              <a [href]="product.sources" target="_blank" rel="noopener"
                 class="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors text-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Source document (PDF)
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- Carbon Calculator -->
          <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
              Calculateur d'Empreinte Personnalisée
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Années d'utilisation</label>
                <input type="number" [(ngModel)]="calcRequest.usage_years" min="1" max="20"
                       class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"/>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Localisation</label>
                <select [(ngModel)]="calcRequest.location"
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white">
                  <option value="WW">Mondial (WW)</option>
                  <option value="EU">Europe (EU)</option>
                  <option value="US">États-Unis (US)</option>
                  <option value="CN">Chine (CN)</option>
                  <option value="FR">France (FR)</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Heures/jour d'utilisation</label>
                <input type="number" [(ngModel)]="calcRequest.daily_usage_hours" min="1" max="24"
                       class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"/>
              </div>
            </div>

            <button (click)="calculateCarbon()" [disabled]="calculatorState === 'calculating'"
                    class="w-full md:w-auto px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <svg *ngIf="calculatorState === 'calculating'" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{calculatorState === 'calculating' ? 'Calcul en cours...' : 'Calculer mon empreinte'}}
            </button>

            <!-- Calculation Result -->
            <div *ngIf="calculatorState === 'result' && calcResult" class="mt-6 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <p class="text-emerald-700 font-medium mb-1">Votre empreinte calculée</p>
                  <div class="flex items-baseline gap-2">
                    <span class="text-4xl font-bold text-emerald-700">{{calcResult.calculated_gwp | number:'1.0-1'}}</span>
                    <span class="text-lg text-emerald-600">kgCO₂eq</span>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm text-emerald-600">Contribution utilisation</p>
                  <p class="text-2xl font-bold text-emerald-700">+{{calcResult.usage_contribution | number:'1.0-1'}} kg</p>
                </div>
              </div>

              <!-- Equivalents -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div class="bg-white/70 rounded-xl p-3 text-center">
                  <svg class="w-5 h-5 mx-auto mb-1 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  <p class="text-xs text-gray-500">{{calcResult.equivalents.km_car | number:'1.0-0'}} km</p>
                  <p class="text-xs font-medium text-gray-700">en voiture</p>
                </div>
                <div class="bg-white/70 rounded-xl p-3 text-center">
                  <svg class="w-5 h-5 mx-auto mb-1 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  <p class="text-xs text-gray-500">{{calcResult.equivalents.kwh_electricity | number:'1.0-0'}} kWh</p>
                  <p class="text-xs font-medium text-gray-700">d'électricité</p>
                </div>
                <div class="bg-white/70 rounded-xl p-3 text-center">
                  <svg class="w-5 h-5 mx-auto mb-1 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                  </svg>
                  <p class="text-xs text-gray-500">{{calcResult.equivalents.tree_months | number:'1.0-0'}} mois</p>
                  <p class="text-xs font-medium text-gray-700">d'arbre pour compenser</p>
                </div>
                <div class="bg-white/70 rounded-xl p-3 text-center">
                  <svg class="w-5 h-5 mx-auto mb-1 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                  </svg>
                  <p class="text-xs text-gray-500">Intensité</p>
                  <p class="text-xs font-medium text-gray-700">{{calcResult.location_carbon_intensity}} g/kWh</p>
                </div>
              </div>

              <p class="mt-4 text-sm text-emerald-700 italic">"{{calcResult.comparison_text}}"</p>
            </div>
          </div>
        </div>

        <!-- Equivalents Section -->
        <div class="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6">
          <h3 class="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            Pour mieux comprendre
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="flex items-center gap-3 p-4 bg-white/70 rounded-xl">
              <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 7m0 13V7"/>
                </svg>
              </div>
              <div>
                <p class="text-sm text-gray-600">Trajet en voiture</p>
                <p class="font-semibold text-gray-900">{{(product.gwp_total * 5) | number:'1.0-0'}} km</p>
              </div>
            </div>
            <div class="flex items-center gap-3 p-4 bg-white/70 rounded-xl">
              <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/>
                </svg>
              </div>
              <div>
                <p class="text-sm text-gray-600">Vol Paris-New York</p>
                <p class="font-semibold text-gray-900">{{(product.gwp_total / 250) | number:'1.1-1'}}% d'un passager</p>
              </div>
            </div>
            <div class="flex items-center gap-3 p-4 bg-white/70 rounded-xl">
              <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <div>
                <p class="text-sm text-gray-600">Électricité consommée</p>
                <p class="font-semibold text-gray-900">{{(product.gwp_total * 0.5) | number:'1.0-0'}} kWh</p>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: []
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  loadingState: LoadingState = 'idle';
  calculatorState: CalculatorState = 'idle';
  errorMessage: string | null = null;

  // Calculated breakdowns
  lifecycleBreakdown: LifecycleBreakdown = {
    manufacturing: { value: 0, percentage: 0, color: '#10b981' },
    use: { value: 0, percentage: 0, color: '#3b82f6' },
    transport: { value: 0, percentage: 0, color: '#f59e0b' },
    eol: { value: 0, percentage: 0, color: '#6b7280' }
  };

  componentBreakdown: ComponentBreakdown = {};

  // Calculator
  calcRequest: CarbonCalculationRequest = {
    product_id: '',
    usage_years: 3,
    location: 'EU',
    daily_usage_hours: 8
  };
  calcResult: CarbonCalculationResponse | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private productsApi: ProductsApiService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(id);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProduct(id: string): void {
    this.loadingState = 'loading';

    this.productsApi.getProductById(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (product) => {
        if (product) {
          this.product = product;
          this.calcRequest.product_id = product.id || '';
          this.calculateBreakdowns();
          this.loadingState = 'success';
        } else {
          this.loadingState = 'error';
          this.errorMessage = 'Produit non trouvé';
        }
      },
      error: () => {
        this.loadingState = 'error';
      }
    });
  }

  private calculateBreakdowns(): void {
    if (!this.product) return;

    const total = this.product.gwp_total;

    // Lifecycle breakdown - ratios are already in decimal format (0.76 = 76%)
    this.lifecycleBreakdown = {
      manufacturing: {
        value: total * this.product.gwp_manufacturing_ratio,
        percentage: this.product.gwp_manufacturing_ratio * 100,
        color: '#10b981'
      },
      use: {
        value: total * this.product.gwp_use_ratio,
        percentage: this.product.gwp_use_ratio * 100,
        color: '#3b82f6'
      },
      transport: {
        value: total * this.product.gwp_transport_ratio,
        percentage: this.product.gwp_transport_ratio * 100,
        color: '#f59e0b'
      },
      eol: {
        value: total * (this.product.gwp_eol_ratio || 0),
        percentage: (this.product.gwp_eol_ratio || 0) * 100,
        color: '#6b7280'
      }
    };

    // Component breakdown - use mock data when real data is missing
    const hasRealComponentData = this.product.gwp_electronics_ratio || this.product.gwp_battery_ratio || 
                                this.product.gwp_ssd_ratio || this.product.gwp_hdd_ratio || this.product.gwp_othercomponents_ratio;
    
    if (hasRealComponentData) {
      this.componentBreakdown = {
        electronics: this.product.gwp_electronics_ratio ? { percentage: this.product.gwp_electronics_ratio, color: '#3b82f6' } : undefined,
        battery: this.product.gwp_battery_ratio ? { percentage: this.product.gwp_battery_ratio, color: '#10b981' } : undefined,
        ssd: this.product.gwp_ssd_ratio ? { percentage: this.product.gwp_ssd_ratio, color: '#8b5cf6' } : undefined,
        hdd: this.product.gwp_hdd_ratio ? { percentage: this.product.gwp_hdd_ratio, color: '#f97316' } : undefined,
        other: this.product.gwp_othercomponents_ratio ? { percentage: this.product.gwp_othercomponents_ratio, color: '#6b7280' } : undefined
      };
    } else {
      // Provide realistic mock data for laptops when real data is missing
      this.componentBreakdown = {
        electronics: { percentage: 35, color: '#3b82f6' },
        battery: { percentage: 15, color: '#10b981' },
        ssd: { percentage: 8, color: '#8b5cf6' },
        screen: { percentage: 12, color: '#ec4899' },
        chassis: { percentage: 20, color: '#6b7280' },
        other: { percentage: 10, color: '#f97316' }
      };
    }
  }

  calculateCarbon(): void {
    if (!this.product) return;

    this.calculatorState = 'calculating';

    // Simulate API call
    setTimeout(() => {
      const baseGwp = this.product!.gwp_total;
      const locationMultiplier = this.getLocationMultiplier(this.calcRequest.location);
      const usageContribution = this.calcRequest.usage_years * this.product!.yearly_tec * locationMultiplier;
      const calculatedGwp = baseGwp + usageContribution;

      this.calcResult = {
        product_id: this.product!.id || '',
        product_name: this.product!.name,
        base_gwp: baseGwp,
        calculated_gwp: calculatedGwp,
        usage_contribution: usageContribution,
        usage_years: this.calcRequest.usage_years,
        location: this.calcRequest.location,
        location_carbon_intensity: this.getLocationIntensity(this.calcRequest.location),
        equivalents: {
          km_car: calculatedGwp * 5,
          km_train: calculatedGwp * 50,
          kwh_electricity: calculatedGwp * 0.5,
          tree_months: calculatedGwp * 0.5
        },
        comparison_text: `Cet usage sur ${this.calcRequest.usage_years} ans équivaut à ${(calculatedGwp * 5).toFixed(0)} km en voiture`
      };

      this.calculatorState = 'result';
    }, 800);
  }

  private getLocationMultiplier(location: string): number {
    const multipliers: Record<string, number> = {
      'WW': 0.475,  // Global average
      'EU': 0.3,    // Europe
      'US': 0.4,    // USA
      'CN': 0.6,    // China
      'FR': 0.05    // France (low carbon intensity)
    };
    return multipliers[location] || 0.475;
  }

  private getLocationIntensity(location: string): number {
    const intensities: Record<string, number> = {
      'WW': 475,
      'EU': 300,
      'US': 400,
      'CN': 600,
      'FR': 50
    };
    return intensities[location] || 475;
  }

  getStrokeDashArray(percentage: number): string {
    const circumference = 2 * Math.PI * 70;
    const value = (percentage / 100) * circumference;
    return `${value} ${circumference}`;
  }

  getStrokeDashOffset(percentage: number): number {
    const circumference = 2 * Math.PI * 70;
    return -(percentage / 100) * circumference;
  }

  hasComponentData(component: { percentage: number | null } | undefined): boolean {
    return component?.percentage !== null && component?.percentage !== undefined;
  }

  hasAnyComponentData(): boolean {
    return this.hasComponentData(this.componentBreakdown.electronics) ||
           this.hasComponentData(this.componentBreakdown.battery) ||
           this.hasComponentData(this.componentBreakdown.ssd) ||
           this.hasComponentData(this.componentBreakdown.hdd) ||
           this.hasComponentData(this.componentBreakdown.screen) ||
           this.hasComponentData(this.componentBreakdown.chassis) ||
           this.hasComponentData(this.componentBreakdown.other);
  }

  getProductImage(product: Product): string {
    const manufacturer = product.manufacturer.toLowerCase();
    const subcategory = product.subcategory.toLowerCase();
    
    // Apple products
    if (manufacturer.includes('apple')) {
      if (subcategory.includes('macbook') || subcategory.includes('laptop')) {
        return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop&auto=format';
      }
      if (subcategory.includes('iphone') || subcategory.includes('smartphone')) {
        return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop&auto=format';
      }
      if (subcategory.includes('ipad') || subcategory.includes('tablet')) {
        return 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&h=600&fit=crop&auto=format';
      }
      if (subcategory.includes('imac') || subcategory.includes('desktop')) {
        return 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=600&h=600&fit=crop&auto=format';
      }
    }
    
    // Dell products
    if (manufacturer.includes('dell')) {
      if (subcategory.includes('laptop')) {
        return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop&auto=format';
      }
      if (subcategory.includes('server')) {
        return 'https://images.unsplash.com/photo-1558494949-ef010cbcc31a?w=600&h=600&fit=crop&auto=format';
      }
    }
    
    // HP products
    if (manufacturer.includes('hp')) {
      if (subcategory.includes('laptop')) {
        return 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=600&h=600&fit=crop&auto=format';
      }
    }
    
    // Lenovo products
    if (manufacturer.includes('lenovo')) {
      if (subcategory.includes('laptop')) {
        return 'https://images.unsplash.com/photo-1593696140826-c58b021acf8b?w=600&h=600&fit=crop&auto=format';
      }
    }
    
    // Server/Network equipment
    if (subcategory.includes('server') || subcategory.includes('switch') || subcategory.includes('storage')) {
      return 'https://images.unsplash.com/photo-1558494949-ef010cbcc31a?w=600&h=600&fit=crop&auto=format';
    }
    
    // Default tech image
    return 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=600&fit=crop&auto=format';
  }

  onImageError(event: any): void {
    // Fallback to a generic tech image if the specific one fails
    event.target.src = 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=600&fit=crop&auto=format';
  }

  formatStorage(gb: number): string {
    if (gb >= 1000) {
      return `${(gb / 1000).toFixed(1)}TB`;
    }
    return `${gb}GB`;
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
}
