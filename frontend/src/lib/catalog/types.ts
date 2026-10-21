export type ProductType = "PRODUCT" | "SERVICE";
export type CategoryType = "LEAD_SOURCE" | "INDUSTRY" | "BUSINESS_TYPE";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message: string;
};

export type Paginated<T> = {
  items: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    lastPage: number;
  };
};

export type Product = {
  id: number;
  sku: string;
  name: string;
  type: ProductType;
  unit: string;
  description: string | null;
  listPrice: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PriceList = {
  id: number;
  code: string;
  name: string;
  currency: string;
  isStandard: boolean;
  isActive: boolean;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  note: string | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PriceListItem = {
  id: number;
  priceListId: number;
  productId: number;
  productSku: string;
  productName: string;
  productType: ProductType;
  unit: string;
  unitPrice: number;
  minQty: number;
};

export type CommonCategory = {
  id: number;
  categoryType: CategoryType;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CatalogStats = {
  productCount: number;
  serviceCount: number;
  priceListCount: number;
  categoryCount: number;
};
