import { apiRequest } from '../api/client';

export interface Product {
  id: number;
  sku: string;
  name: string;
  type: 'PRODUCT' | 'SERVICE';
  unit?: string | null;
  description?: string | null;
  list_price: string | number;
  currency: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PriceListItem {
  id: number;
  price_list_id: number;
  product_id: number;
  unit_price: string | number;
  min_quantity: number;
  product?: Product;
}

export interface PriceList {
  id: number;
  code: string;
  name: string;
  currency: string;
  is_standard: boolean;
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  items_count?: number;
  items?: PriceListItem[];
  created_at?: string;
  updated_at?: string;
}

export interface ProductsResponse {
  success: boolean;
  message?: string;
  data: Product[];
  meta?: {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface PriceListsResponse {
  success: boolean;
  message?: string;
  data: PriceList[];
}

export async function getProducts(params: Record<string, string> = {}): Promise<ProductsResponse> {
  const query = new URLSearchParams(params).toString();
  return apiRequest<ProductsResponse>(`/v1/products${query ? `?${query}` : ''}`);
}

export async function createProduct(payload: Partial<Product>): Promise<{ success: boolean; data: Product }> {
  return apiRequest<{ success: boolean; data: Product }>('/v1/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(id: number, payload: Partial<Product>): Promise<{ success: boolean; data: Product }> {
  return apiRequest<{ success: boolean; data: Product }>(`/v1/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(id: number): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/v1/products/${id}`, {
    method: 'DELETE',
  });
}

export async function getPriceLists(): Promise<PriceListsResponse> {
  return apiRequest<PriceListsResponse>('/v1/price-lists');
}

export async function getPriceListDetail(id: number): Promise<{ success: boolean; data: PriceList }> {
  return apiRequest<{ success: boolean; data: PriceList }>(`/v1/price-lists/${id}`);
}

export async function createPriceList(payload: Partial<PriceList>): Promise<{ success: boolean; data: PriceList }> {
  return apiRequest<{ success: boolean; data: PriceList }>('/v1/price-lists', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function upsertPriceListItem(
  priceListId: number,
  payload: { product_id: number; unit_price: number; min_quantity?: number }
): Promise<{ success: boolean; data: PriceListItem }> {
  return apiRequest<{ success: boolean; data: PriceListItem }>(`/v1/price-lists/${priceListId}/items`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deletePriceListItem(priceListId: number, itemId: number): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/v1/price-lists/${priceListId}/items/${itemId}`, {
    method: 'DELETE',
  });
}
