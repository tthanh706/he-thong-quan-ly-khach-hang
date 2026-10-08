import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ApiSuccess } from "./types";
import * as store from "./store";

function ok<T>(data: T, message: string): ApiSuccess<T> {
  return { success: true, data, message };
}

const listQuery = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(5).max(50).default(10),
  q: z.string().optional(),
  type: z.enum(["PRODUCT", "SERVICE", "ALL"]).optional(),
  active: z.enum(["all", "active", "inactive"]).optional(),
});

export const getCatalogStats = createServerFn({ method: "GET" }).handler(async () => {
  return ok(store.stats(), "OK");
});

export const listProducts = createServerFn({ method: "GET" })
  .validator(listQuery)
  .handler(async ({ data }) => {
    return ok(store.listProductRows(data), "Danh sách sản phẩm / dịch vụ");
  });

const productInput = z.object({
  sku: z.string().min(2).max(64),
  name: z.string().min(2).max(255),
  type: z.enum(["PRODUCT", "SERVICE"]),
  unit: z.string().min(1).max(32),
  description: z.string().max(2000).optional().nullable(),
  listPrice: z.number().min(0),
  currency: z.string().min(3).max(8).default("VND"),
  isActive: z.boolean().default(true),
});

export const createProduct = createServerFn({ method: "POST" })
  .validator(productInput)
  .handler(async ({ data }) => ok(store.addProduct(data), "Đã tạo sản phẩm / dịch vụ"));

export const updateProduct = createServerFn({ method: "POST" })
  .validator(productInput.extend({ id: z.number().int() }))
  .handler(async ({ data }) => {
    const { id, ...rest } = data;
    return ok(store.patchProduct(id, rest), "Đã cập nhật");
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int() }))
  .handler(async ({ data }) => {
    store.removeProduct(data.id);
    return ok({ id: data.id }, "Đã xóa (soft delete)");
  });

export const listPriceLists = createServerFn({ method: "GET" }).handler(async () => {
  return ok(store.allPriceLists(), "Danh sách bảng giá");
});

const priceListInput = z.object({
  code: z.string().min(2).max(64),
  name: z.string().min(2).max(255),
  currency: z.string().min(3).max(8).default("VND"),
  isStandard: z.boolean().default(false),
  isActive: z.boolean().default(true),
  effectiveFrom: z.string().nullable().optional(),
  effectiveTo: z.string().nullable().optional(),
  note: z.string().max(2000).nullable().optional(),
});

export const createPriceList = createServerFn({ method: "POST" })
  .validator(priceListInput)
  .handler(async ({ data }) => ok(store.addPriceList(data), "Đã tạo bảng giá"));

export const updatePriceList = createServerFn({ method: "POST" })
  .validator(priceListInput.extend({ id: z.number().int() }))
  .handler(async ({ data }) => {
    const { id, ...rest } = data;
    return ok(store.patchPriceList(id, rest), "Đã cập nhật bảng giá");
  });

export const getPriceListDetail = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.number().int() }))
  .handler(async ({ data }) => ok(store.priceListDetail(data.id), "Chi tiết bảng giá"));

export const upsertPriceListItem = createServerFn({ method: "POST" })
  .validator(
    z.object({
      priceListId: z.number().int(),
      productId: z.number().int(),
      unitPrice: z.number().min(0),
      minQty: z.number().min(0.01).default(1),
    }),
  )
  .handler(async ({ data }) => {
    store.upsertItem(data);
    return ok({ ok: true }, "Đã lưu dòng giá");
  });

export const deletePriceListItem = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int() }))
  .handler(async ({ data }) => {
    store.removeItem(data.id);
    return ok({ id: data.id }, "Đã gỡ dòng giá");
  });

export const listCategories = createServerFn({ method: "GET" })
  .validator(
    z.object({
      categoryType: z.enum(["LEAD_SOURCE", "INDUSTRY", "BUSINESS_TYPE", "ALL"]).default("ALL"),
    }),
  )
  .handler(async ({ data }) => ok(store.listCats(data.categoryType), "Danh mục dùng chung"));

const catInput = z.object({
  categoryType: z.enum(["LEAD_SOURCE", "INDUSTRY", "BUSINESS_TYPE"]),
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).nullable().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const createCategory = createServerFn({ method: "POST" })
  .validator(catInput)
  .handler(async ({ data }) => ok(store.addCat(data), "Đã tạo danh mục"));

export const updateCategory = createServerFn({ method: "POST" })
  .validator(catInput.extend({ id: z.number().int() }))
  .handler(async ({ data }) => {
    const { id, ...rest } = data;
    return ok(store.patchCat(id, rest), "Đã cập nhật danh mục");
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int() }))
  .handler(async ({ data }) => {
    store.removeCat(data.id);
    return ok({ id: data.id }, "Đã xóa danh mục");
  });
