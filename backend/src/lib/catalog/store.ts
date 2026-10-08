import type {
  CategoryType,
  CommonCategory,
  Paginated,
  PriceList,
  PriceListItem,
  Product,
  ProductType,
} from "./types";

let seq = 1;
const now = () => new Date().toISOString();

const products: Product[] = [];
const priceLists: PriceList[] = [];
const items: PriceListItem[] = [];
const categories: CommonCategory[] = [];
let seeded = false;

export function seedStore() {
  if (seeded) return;
  seeded = true;
  const defs: Array<Omit<Product, "id" | "createdAt" | "updatedAt" | "isActive" | "currency">> = [
    { sku: "CRM-CORE", name: "Gói CRM Doanh nghiệp", type: "SERVICE", unit: "license", description: "Giấy phép CRM theo năm, gồm 20 user.", listPrice: 18000000 },
    { sku: "CRM-ADDON", name: "User bổ sung CRM", type: "SERVICE", unit: "user", description: "User thêm ngoài gói chuẩn.", listPrice: 450000 },
    { sku: "IMP-ONB", name: "Dịch vụ triển khai & onboarding", type: "SERVICE", unit: "project", description: "Khảo sát, cấu hình pipeline, đào tạo.", listPrice: 25000000 },
    { sku: "HW-SCAN", name: "Máy quét danh thiếp", type: "PRODUCT", unit: "pcs", description: "Thiết bị nhập danh thiếp vào CRM.", listPrice: 3200000 },
    { sku: "SW-SIGN", name: "Chữ ký số USB Token", type: "PRODUCT", unit: "pcs", description: "Token ký hợp đồng điện tử.", listPrice: 1850000 },
  ];
  const ts = now();
  for (const d of defs) {
    products.push({ ...d, id: seq++, currency: "VND", isActive: true, createdAt: ts, updatedAt: ts });
  }
  const std: PriceList = {
    id: seq++,
    code: "PL-STD-2026",
    name: "Bảng giá niêm yết 2026",
    currency: "VND",
    isStandard: true,
    isActive: true,
    effectiveFrom: "2026-01-01",
    effectiveTo: null,
    note: "Giá chuẩn toàn hệ thống, Giám đốc KD phê duyệt.",
    itemCount: 0,
    createdAt: ts,
    updatedAt: ts,
  };
  const ent: PriceList = {
    id: seq++,
    code: "PL-ENT",
    name: "Bảng giá khách hàng Enterprise",
    currency: "VND",
    isStandard: false,
    isActive: true,
    effectiveFrom: "2026-01-01",
    effectiveTo: null,
    note: "Áp dụng cho hợp đồng khung > 500 triệu.",
    itemCount: 0,
    createdAt: ts,
    updatedAt: ts,
  };
  priceLists.push(std, ent);
  for (const list of priceLists) {
    for (const p of products) {
      items.push({
        id: seq++,
        priceListId: list.id,
        productId: p.id,
        productSku: p.sku,
        productName: p.name,
        productType: p.type,
        unit: p.unit,
        unitPrice: list.isStandard ? p.listPrice : Math.round(p.listPrice * 0.92),
        minQty: 1,
      });
    }
  }
  const cats: Array<[CategoryType, string, string, string | null, number]> = [
    ["LEAD_SOURCE", "WEB", "Website", "Form liên hệ / landing page", 10],
    ["LEAD_SOURCE", "REF", "Giới thiệu", "Khách hàng hiện tại giới thiệu", 20],
    ["LEAD_SOURCE", "EVENT", "Sự kiện", "Hội thảo, triển lãm, webinar", 30],
    ["LEAD_SOURCE", "ADS", "Quảng cáo", "Google Ads, Facebook Ads", 40],
    ["LEAD_SOURCE", "COLD", "Cold call", "Gọi lạnh từ danh sách", 50],
    ["INDUSTRY", "IT", "Công nghệ thông tin", null, 10],
    ["INDUSTRY", "MFG", "Sản xuất", null, 20],
    ["INDUSTRY", "FMCG", "Hàng tiêu dùng", null, 30],
    ["INDUSTRY", "FIN", "Tài chính / Ngân hàng", null, 40],
    ["INDUSTRY", "EDU", "Giáo dục", null, 50],
    ["INDUSTRY", "HLTH", "Y tế", null, 60],
    ["BUSINESS_TYPE", "LLC", "Công ty TNHH", null, 10],
    ["BUSINESS_TYPE", "JSC", "Công ty cổ phần", null, 20],
    ["BUSINESS_TYPE", "PE", "Doanh nghiệp tư nhân", null, 30],
    ["BUSINESS_TYPE", "SOE", "Doanh nghiệp nhà nước", null, 40],
    ["BUSINESS_TYPE", "FDI", "Doanh nghiệp FDI", null, 50],
  ];
  for (const [categoryType, code, name, description, sortOrder] of cats) {
    categories.push({
      id: seq++,
      categoryType,
      code,
      name,
      description,
      sortOrder,
      isActive: true,
      createdAt: ts,
      updatedAt: ts,
    });
  }
}

function recount() {
  for (const pl of priceLists) {
    pl.itemCount = items.filter((i) => i.priceListId === pl.id).length;
  }
}

export function stats() {
  seedStore();
  return {
    productCount: products.filter((p) => p.type === "PRODUCT").length,
    serviceCount: products.filter((p) => p.type === "SERVICE").length,
    priceListCount: priceLists.length,
    categoryCount: categories.length,
  };
}

export function listProductRows(opts: {
  page: number;
  perPage: number;
  q?: string;
  type?: "PRODUCT" | "SERVICE" | "ALL";
  active?: "all" | "active" | "inactive";
}): Paginated<Product> {
  seedStore();
  let rows = [...products];
  if (opts.q?.trim()) {
    const q = opts.q.trim().toLowerCase();
    rows = rows.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }
  if (opts.type && opts.type !== "ALL") rows = rows.filter((p) => p.type === opts.type);
  if (opts.active === "active") rows = rows.filter((p) => p.isActive);
  if (opts.active === "inactive") rows = rows.filter((p) => !p.isActive);
  rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const total = rows.length;
  const start = (opts.page - 1) * opts.perPage;
  return {
    items: rows.slice(start, start + opts.perPage),
    meta: {
      page: opts.page,
      perPage: opts.perPage,
      total,
      lastPage: Math.max(1, Math.ceil(total / opts.perPage)),
    },
  };
}

export function addProduct(input: {
  sku: string;
  name: string;
  type: ProductType;
  unit: string;
  description?: string | null;
  listPrice: number;
  currency: string;
  isActive: boolean;
}): Product {
  seedStore();
  const sku = input.sku.trim().toUpperCase();
  if (products.some((p) => p.sku === sku)) throw new Error("SKU đã tồn tại.");
  const ts = now();
  const p: Product = {
    id: seq++,
    sku,
    name: input.name.trim(),
    type: input.type,
    unit: input.unit.trim(),
    description: input.description ?? null,
    listPrice: input.listPrice,
    currency: input.currency,
    isActive: input.isActive,
    createdAt: ts,
    updatedAt: ts,
  };
  products.unshift(p);
  return p;
}

export function patchProduct(id: number, input: Parameters<typeof addProduct>[0]): Product {
  seedStore();
  const p = products.find((x) => x.id === id);
  if (!p) throw new Error("Không tìm thấy bản ghi.");
  const sku = input.sku.trim().toUpperCase();
  if (products.some((x) => x.sku === sku && x.id !== id)) throw new Error("SKU đã tồn tại.");
  Object.assign(p, {
    sku,
    name: input.name.trim(),
    type: input.type,
    unit: input.unit.trim(),
    description: input.description ?? null,
    listPrice: input.listPrice,
    currency: input.currency,
    isActive: input.isActive,
    updatedAt: now(),
  });
  return p;
}

export function removeProduct(id: number) {
  seedStore();
  const i = products.findIndex((p) => p.id === id);
  if (i >= 0) products.splice(i, 1);
  for (let j = items.length - 1; j >= 0; j--) {
    if (items[j].productId === id) items.splice(j, 1);
  }
  recount();
}

export function allPriceLists(): PriceList[] {
  seedStore();
  recount();
  return [...priceLists].sort((a, b) => Number(b.isStandard) - Number(a.isStandard));
}

export function addPriceList(input: {
  code: string;
  name: string;
  currency: string;
  isStandard: boolean;
  isActive: boolean;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  note?: string | null;
}): PriceList {
  seedStore();
  if (input.isStandard) priceLists.forEach((p) => (p.isStandard = false));
  const ts = now();
  const pl: PriceList = {
    id: seq++,
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    currency: input.currency,
    isStandard: input.isStandard,
    isActive: input.isActive,
    effectiveFrom: input.effectiveFrom || null,
    effectiveTo: input.effectiveTo || null,
    note: input.note ?? null,
    itemCount: 0,
    createdAt: ts,
    updatedAt: ts,
  };
  priceLists.unshift(pl);
  return pl;
}

export function patchPriceList(id: number, input: Parameters<typeof addPriceList>[0]): PriceList {
  seedStore();
  const pl = priceLists.find((x) => x.id === id);
  if (!pl) throw new Error("Không tìm thấy bảng giá.");
  if (input.isStandard) priceLists.forEach((p) => (p.isStandard = p.id === id));
  Object.assign(pl, {
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    currency: input.currency,
    isStandard: input.isStandard,
    isActive: input.isActive,
    effectiveFrom: input.effectiveFrom || null,
    effectiveTo: input.effectiveTo || null,
    note: input.note ?? null,
    updatedAt: now(),
  });
  recount();
  return pl;
}

export function priceListDetail(id: number) {
  seedStore();
  recount();
  const list = priceLists.find((x) => x.id === id);
  if (!list) throw new Error("Không tìm thấy bảng giá.");
  return { list, items: items.filter((i) => i.priceListId === id) };
}

export function upsertItem(input: {
  priceListId: number;
  productId: number;
  unitPrice: number;
  minQty: number;
}) {
  seedStore();
  const product = products.find((p) => p.id === input.productId);
  if (!product) throw new Error("Không tìm thấy sản phẩm.");
  const existing = items.find(
    (i) => i.priceListId === input.priceListId && i.productId === input.productId,
  );
  if (existing) {
    existing.unitPrice = input.unitPrice;
    existing.minQty = input.minQty;
  } else {
    items.push({
      id: seq++,
      priceListId: input.priceListId,
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      productType: product.type,
      unit: product.unit,
      unitPrice: input.unitPrice,
      minQty: input.minQty,
    });
  }
  recount();
}

export function removeItem(id: number) {
  seedStore();
  const i = items.findIndex((x) => x.id === id);
  if (i >= 0) items.splice(i, 1);
  recount();
}

export function listCats(categoryType: CategoryType | "ALL") {
  seedStore();
  const rows =
    categoryType === "ALL" ? [...categories] : categories.filter((c) => c.categoryType === categoryType);
  rows.sort((a, b) => a.categoryType.localeCompare(b.categoryType) || a.sortOrder - b.sortOrder);
  return rows;
}

export function addCat(input: {
  categoryType: CategoryType;
  code: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
}): CommonCategory {
  seedStore();
  const code = input.code.trim().toUpperCase();
  if (categories.some((c) => c.categoryType === input.categoryType && c.code === code)) {
    throw new Error("Mã danh mục đã tồn tại trong loại này.");
  }
  const ts = now();
  const c: CommonCategory = {
    id: seq++,
    categoryType: input.categoryType,
    code,
    name: input.name.trim(),
    description: input.description ?? null,
    sortOrder: input.sortOrder,
    isActive: input.isActive,
    createdAt: ts,
    updatedAt: ts,
  };
  categories.push(c);
  return c;
}

export function patchCat(id: number, input: Parameters<typeof addCat>[0]): CommonCategory {
  seedStore();
  const c = categories.find((x) => x.id === id);
  if (!c) throw new Error("Không tìm thấy danh mục.");
  const code = input.code.trim().toUpperCase();
  if (categories.some((x) => x.categoryType === input.categoryType && x.code === code && x.id !== id)) {
    throw new Error("Mã danh mục đã tồn tại trong loại này.");
  }
  Object.assign(c, {
    categoryType: input.categoryType,
    code,
    name: input.name.trim(),
    description: input.description ?? null,
    sortOrder: input.sortOrder,
    isActive: input.isActive,
    updatedAt: now(),
  });
  return c;
}

export function removeCat(id: number) {
  seedStore();
  const i = categories.findIndex((c) => c.id === id);
  if (i >= 0) categories.splice(i, 1);
}
