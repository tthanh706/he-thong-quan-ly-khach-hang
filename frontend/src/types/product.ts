export interface Product {
  id: number;
  code: string;
  name: string;
  type: 'PRODUCT' | 'SERVICE';
  unit?: string;
  listPrice: number;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductPayload {
  code: string;
  name: string;
  type: 'PRODUCT' | 'SERVICE';
  unit?: string;
  listPrice: number;
  description?: string;
  isActive?: boolean;
}