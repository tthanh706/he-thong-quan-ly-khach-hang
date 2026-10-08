import axiosInstance from './axiosInstance';
import type { Product, CreateProductPayload } from '../../types/product';

let MOCK_PRODUCTS: Product[] = [
  { 
    id: 1, 
    code: 'SVC-001', 
    name: 'Phần mềm CRM Standard', 
    type: 'PRODUCT', 
    unit: 'Gói', 
    listPrice: 15000000, 
    isActive: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 2, 
    code: 'SVC-002', 
    name: 'Dịch vụ Triển khai & Đào tạo', 
    type: 'SERVICE', 
    unit: 'Buổi', 
    listPrice: 3000000, 
    isActive: true,
    createdAt: new Date().toISOString()
  },
];

export const productApi = {
  getProducts: async () => {
    try {
      const response = await axiosInstance.get('/products');
      return response.data;
    } catch {
      return { data: MOCK_PRODUCTS };
    }
  },

  createProduct: async (payload: CreateProductPayload): Promise<Product> => {
    try {
      const response = await axiosInstance.post('/products', payload);
      return response.data.data;
    } catch {
      const newProduct: Product = {
        id: Date.now(),
        code: payload.code,
        name: payload.name,
        type: payload.type || 'PRODUCT',
        unit: payload.unit || 'Cái',
        listPrice: payload.listPrice || 0,
        description: payload.description || '',
        isActive: payload.isActive ?? true,
        createdAt: new Date().toISOString(),
      };
      MOCK_PRODUCTS.push(newProduct);
      return newProduct;
    }
  },

  updateProduct: async (id: number, payload: Partial<CreateProductPayload>): Promise<Product> => {
    try {
      const response = await axiosInstance.put(`/products/${id}`, payload);
      return response.data.data;
    } catch {
      MOCK_PRODUCTS = MOCK_PRODUCTS.map((p) =>
        p.id === id ? { ...p, ...payload, updatedAt: new Date().toISOString() } : p
      );
      const updated = MOCK_PRODUCTS.find((p) => p.id === id);
      return updated!;
    }
  },

  deleteProduct: async (id: number | string) => {
    try {
      return await axiosInstance.delete(`/products/${id}`);
    } catch {
      MOCK_PRODUCTS = MOCK_PRODUCTS.filter((p) => p.id !== Number(id));
      return { success: true };
    }
  },
};