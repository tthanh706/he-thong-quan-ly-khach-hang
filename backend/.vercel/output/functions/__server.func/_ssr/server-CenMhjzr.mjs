import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { a as object, i as number, n as boolean, o as string, t as _enum } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/server-CenMhjzr.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var seq = 1;
var now = () => (/* @__PURE__ */ new Date()).toISOString();
var products = [];
var priceLists = [];
var items = [];
var categories = [];
var seeded = false;
function seedStore() {
	if (seeded) return;
	seeded = true;
	const defs = [
		{
			sku: "CRM-CORE",
			name: "Gói CRM Doanh nghiệp",
			type: "SERVICE",
			unit: "license",
			description: "Giấy phép CRM theo năm, gồm 20 user.",
			listPrice: 18e6
		},
		{
			sku: "CRM-ADDON",
			name: "User bổ sung CRM",
			type: "SERVICE",
			unit: "user",
			description: "User thêm ngoài gói chuẩn.",
			listPrice: 45e4
		},
		{
			sku: "IMP-ONB",
			name: "Dịch vụ triển khai & onboarding",
			type: "SERVICE",
			unit: "project",
			description: "Khảo sát, cấu hình pipeline, đào tạo.",
			listPrice: 25e6
		},
		{
			sku: "HW-SCAN",
			name: "Máy quét danh thiếp",
			type: "PRODUCT",
			unit: "pcs",
			description: "Thiết bị nhập danh thiếp vào CRM.",
			listPrice: 32e5
		},
		{
			sku: "SW-SIGN",
			name: "Chữ ký số USB Token",
			type: "PRODUCT",
			unit: "pcs",
			description: "Token ký hợp đồng điện tử.",
			listPrice: 185e4
		}
	];
	const ts = now();
	for (const d of defs) products.push({
		...d,
		id: seq++,
		currency: "VND",
		isActive: true,
		createdAt: ts,
		updatedAt: ts
	});
	const std = {
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
		updatedAt: ts
	};
	const ent = {
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
		updatedAt: ts
	};
	priceLists.push(std, ent);
	for (const list of priceLists) for (const p of products) items.push({
		id: seq++,
		priceListId: list.id,
		productId: p.id,
		productSku: p.sku,
		productName: p.name,
		productType: p.type,
		unit: p.unit,
		unitPrice: list.isStandard ? p.listPrice : Math.round(p.listPrice * .92),
		minQty: 1
	});
	for (const [categoryType, code, name, description, sortOrder] of [
		[
			"LEAD_SOURCE",
			"WEB",
			"Website",
			"Form liên hệ / landing page",
			10
		],
		[
			"LEAD_SOURCE",
			"REF",
			"Giới thiệu",
			"Khách hàng hiện tại giới thiệu",
			20
		],
		[
			"LEAD_SOURCE",
			"EVENT",
			"Sự kiện",
			"Hội thảo, triển lãm, webinar",
			30
		],
		[
			"LEAD_SOURCE",
			"ADS",
			"Quảng cáo",
			"Google Ads, Facebook Ads",
			40
		],
		[
			"LEAD_SOURCE",
			"COLD",
			"Cold call",
			"Gọi lạnh từ danh sách",
			50
		],
		[
			"INDUSTRY",
			"IT",
			"Công nghệ thông tin",
			null,
			10
		],
		[
			"INDUSTRY",
			"MFG",
			"Sản xuất",
			null,
			20
		],
		[
			"INDUSTRY",
			"FMCG",
			"Hàng tiêu dùng",
			null,
			30
		],
		[
			"INDUSTRY",
			"FIN",
			"Tài chính / Ngân hàng",
			null,
			40
		],
		[
			"INDUSTRY",
			"EDU",
			"Giáo dục",
			null,
			50
		],
		[
			"INDUSTRY",
			"HLTH",
			"Y tế",
			null,
			60
		],
		[
			"BUSINESS_TYPE",
			"LLC",
			"Công ty TNHH",
			null,
			10
		],
		[
			"BUSINESS_TYPE",
			"JSC",
			"Công ty cổ phần",
			null,
			20
		],
		[
			"BUSINESS_TYPE",
			"PE",
			"Doanh nghiệp tư nhân",
			null,
			30
		],
		[
			"BUSINESS_TYPE",
			"SOE",
			"Doanh nghiệp nhà nước",
			null,
			40
		],
		[
			"BUSINESS_TYPE",
			"FDI",
			"Doanh nghiệp FDI",
			null,
			50
		]
	]) categories.push({
		id: seq++,
		categoryType,
		code,
		name,
		description,
		sortOrder,
		isActive: true,
		createdAt: ts,
		updatedAt: ts
	});
}
function recount() {
	for (const pl of priceLists) pl.itemCount = items.filter((i) => i.priceListId === pl.id).length;
}
function stats() {
	seedStore();
	return {
		productCount: products.filter((p) => p.type === "PRODUCT").length,
		serviceCount: products.filter((p) => p.type === "SERVICE").length,
		priceListCount: priceLists.length,
		categoryCount: categories.length
	};
}
function listProductRows(opts) {
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
			lastPage: Math.max(1, Math.ceil(total / opts.perPage))
		}
	};
}
function addProduct(input) {
	seedStore();
	const sku = input.sku.trim().toUpperCase();
	if (products.some((p) => p.sku === sku)) throw new Error("SKU đã tồn tại.");
	const ts = now();
	const p = {
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
		updatedAt: ts
	};
	products.unshift(p);
	return p;
}
function patchProduct(id, input) {
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
		updatedAt: now()
	});
	return p;
}
function removeProduct(id) {
	seedStore();
	const i = products.findIndex((p) => p.id === id);
	if (i >= 0) products.splice(i, 1);
	for (let j = items.length - 1; j >= 0; j--) if (items[j].productId === id) items.splice(j, 1);
	recount();
}
function allPriceLists() {
	seedStore();
	recount();
	return [...priceLists].sort((a, b) => Number(b.isStandard) - Number(a.isStandard));
}
function addPriceList(input) {
	seedStore();
	if (input.isStandard) priceLists.forEach((p) => p.isStandard = false);
	const ts = now();
	const pl = {
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
		updatedAt: ts
	};
	priceLists.unshift(pl);
	return pl;
}
function patchPriceList(id, input) {
	seedStore();
	const pl = priceLists.find((x) => x.id === id);
	if (!pl) throw new Error("Không tìm thấy bảng giá.");
	if (input.isStandard) priceLists.forEach((p) => p.isStandard = p.id === id);
	Object.assign(pl, {
		code: input.code.trim().toUpperCase(),
		name: input.name.trim(),
		currency: input.currency,
		isStandard: input.isStandard,
		isActive: input.isActive,
		effectiveFrom: input.effectiveFrom || null,
		effectiveTo: input.effectiveTo || null,
		note: input.note ?? null,
		updatedAt: now()
	});
	recount();
	return pl;
}
function priceListDetail(id) {
	seedStore();
	recount();
	const list = priceLists.find((x) => x.id === id);
	if (!list) throw new Error("Không tìm thấy bảng giá.");
	return {
		list,
		items: items.filter((i) => i.priceListId === id)
	};
}
function upsertItem(input) {
	seedStore();
	const product = products.find((p) => p.id === input.productId);
	if (!product) throw new Error("Không tìm thấy sản phẩm.");
	const existing = items.find((i) => i.priceListId === input.priceListId && i.productId === input.productId);
	if (existing) {
		existing.unitPrice = input.unitPrice;
		existing.minQty = input.minQty;
	} else items.push({
		id: seq++,
		priceListId: input.priceListId,
		productId: product.id,
		productSku: product.sku,
		productName: product.name,
		productType: product.type,
		unit: product.unit,
		unitPrice: input.unitPrice,
		minQty: input.minQty
	});
	recount();
}
function removeItem(id) {
	seedStore();
	const i = items.findIndex((x) => x.id === id);
	if (i >= 0) items.splice(i, 1);
	recount();
}
function listCats(categoryType) {
	seedStore();
	const rows = categoryType === "ALL" ? [...categories] : categories.filter((c) => c.categoryType === categoryType);
	rows.sort((a, b) => a.categoryType.localeCompare(b.categoryType) || a.sortOrder - b.sortOrder);
	return rows;
}
function addCat(input) {
	seedStore();
	const code = input.code.trim().toUpperCase();
	if (categories.some((c) => c.categoryType === input.categoryType && c.code === code)) throw new Error("Mã danh mục đã tồn tại trong loại này.");
	const ts = now();
	const c = {
		id: seq++,
		categoryType: input.categoryType,
		code,
		name: input.name.trim(),
		description: input.description ?? null,
		sortOrder: input.sortOrder,
		isActive: input.isActive,
		createdAt: ts,
		updatedAt: ts
	};
	categories.push(c);
	return c;
}
function patchCat(id, input) {
	seedStore();
	const c = categories.find((x) => x.id === id);
	if (!c) throw new Error("Không tìm thấy danh mục.");
	const code = input.code.trim().toUpperCase();
	if (categories.some((x) => x.categoryType === input.categoryType && x.code === code && x.id !== id)) throw new Error("Mã danh mục đã tồn tại trong loại này.");
	Object.assign(c, {
		categoryType: input.categoryType,
		code,
		name: input.name.trim(),
		description: input.description ?? null,
		sortOrder: input.sortOrder,
		isActive: input.isActive,
		updatedAt: now()
	});
	return c;
}
function removeCat(id) {
	seedStore();
	const i = categories.findIndex((c) => c.id === id);
	if (i >= 0) categories.splice(i, 1);
}
function ok(data, message) {
	return {
		success: true,
		data,
		message
	};
}
var listQuery = object({
	page: number().int().min(1).default(1),
	perPage: number().int().min(5).max(50).default(10),
	q: string().optional(),
	type: _enum([
		"PRODUCT",
		"SERVICE",
		"ALL"
	]).optional(),
	active: _enum([
		"all",
		"active",
		"inactive"
	]).optional()
});
var getCatalogStats_createServerFn_handler = createServerRpc({
	id: "81da93c2742b620e3b57cff8a4a66572fdf693d0f2e85433e7805e3c1845ab01",
	name: "getCatalogStats",
	filename: "src/lib/catalog/server.ts"
}, (opts) => getCatalogStats.__executeServer(opts));
var getCatalogStats = createServerFn({ method: "GET" }).handler(getCatalogStats_createServerFn_handler, async () => {
	return ok(stats(), "OK");
});
var listProducts_createServerFn_handler = createServerRpc({
	id: "27f32f6f8a39373260e99fa9f5993eeba5dc91f95d32726c026635fe5f74be5b",
	name: "listProducts",
	filename: "src/lib/catalog/server.ts"
}, (opts) => listProducts.__executeServer(opts));
var listProducts = createServerFn({ method: "GET" }).validator(listQuery).handler(listProducts_createServerFn_handler, async ({ data }) => {
	return ok(listProductRows(data), "Danh sách sản phẩm / dịch vụ");
});
var productInput = object({
	sku: string().min(2).max(64),
	name: string().min(2).max(255),
	type: _enum(["PRODUCT", "SERVICE"]),
	unit: string().min(1).max(32),
	description: string().max(2e3).optional().nullable(),
	listPrice: number().min(0),
	currency: string().min(3).max(8).default("VND"),
	isActive: boolean().default(true)
});
var createProduct_createServerFn_handler = createServerRpc({
	id: "4f41b909c2d360997ddf9f2026ec97ad58abd13b7252a8bd49142c8d8c61dc13",
	name: "createProduct",
	filename: "src/lib/catalog/server.ts"
}, (opts) => createProduct.__executeServer(opts));
var createProduct = createServerFn({ method: "POST" }).validator(productInput).handler(createProduct_createServerFn_handler, async ({ data }) => ok(addProduct(data), "Đã tạo sản phẩm / dịch vụ"));
var updateProduct_createServerFn_handler = createServerRpc({
	id: "711b353cd5dea199de2e8229e092fcd350a8fbfe25e3c5c2c6448e018f7ae560",
	name: "updateProduct",
	filename: "src/lib/catalog/server.ts"
}, (opts) => updateProduct.__executeServer(opts));
var updateProduct = createServerFn({ method: "POST" }).validator(productInput.extend({ id: number().int() })).handler(updateProduct_createServerFn_handler, async ({ data }) => {
	const { id, ...rest } = data;
	return ok(patchProduct(id, rest), "Đã cập nhật");
});
var deleteProduct_createServerFn_handler = createServerRpc({
	id: "17ee3e7cdf266094881a59363d7b3e33b1c8fa618440f6761807a55a4e5d0f90",
	name: "deleteProduct",
	filename: "src/lib/catalog/server.ts"
}, (opts) => deleteProduct.__executeServer(opts));
var deleteProduct = createServerFn({ method: "POST" }).validator(object({ id: number().int() })).handler(deleteProduct_createServerFn_handler, async ({ data }) => {
	removeProduct(data.id);
	return ok({ id: data.id }, "Đã xóa (soft delete)");
});
var listPriceLists_createServerFn_handler = createServerRpc({
	id: "7d37d6f1603d3625b36564c9eabe7a4bdcbe5fb57066b37df385cacb059c1662",
	name: "listPriceLists",
	filename: "src/lib/catalog/server.ts"
}, (opts) => listPriceLists.__executeServer(opts));
var listPriceLists = createServerFn({ method: "GET" }).handler(listPriceLists_createServerFn_handler, async () => {
	return ok(allPriceLists(), "Danh sách bảng giá");
});
var priceListInput = object({
	code: string().min(2).max(64),
	name: string().min(2).max(255),
	currency: string().min(3).max(8).default("VND"),
	isStandard: boolean().default(false),
	isActive: boolean().default(true),
	effectiveFrom: string().nullable().optional(),
	effectiveTo: string().nullable().optional(),
	note: string().max(2e3).nullable().optional()
});
var createPriceList_createServerFn_handler = createServerRpc({
	id: "528faf25ac186962d4d8f574bab1a46e1dee6defbfb61a03425f5788b1fa7521",
	name: "createPriceList",
	filename: "src/lib/catalog/server.ts"
}, (opts) => createPriceList.__executeServer(opts));
var createPriceList = createServerFn({ method: "POST" }).validator(priceListInput).handler(createPriceList_createServerFn_handler, async ({ data }) => ok(addPriceList(data), "Đã tạo bảng giá"));
var updatePriceList_createServerFn_handler = createServerRpc({
	id: "d9b1cad323e9d2bbc4ead4fc8bdab4a2228c0f904a796e0314afd256e3050864",
	name: "updatePriceList",
	filename: "src/lib/catalog/server.ts"
}, (opts) => updatePriceList.__executeServer(opts));
var updatePriceList = createServerFn({ method: "POST" }).validator(priceListInput.extend({ id: number().int() })).handler(updatePriceList_createServerFn_handler, async ({ data }) => {
	const { id, ...rest } = data;
	return ok(patchPriceList(id, rest), "Đã cập nhật bảng giá");
});
var getPriceListDetail_createServerFn_handler = createServerRpc({
	id: "289d9e9acd585304733bc31bc80608428c65fc7b0d6d942267980417ff7d8012",
	name: "getPriceListDetail",
	filename: "src/lib/catalog/server.ts"
}, (opts) => getPriceListDetail.__executeServer(opts));
var getPriceListDetail = createServerFn({ method: "GET" }).validator(object({ id: number().int() })).handler(getPriceListDetail_createServerFn_handler, async ({ data }) => ok(priceListDetail(data.id), "Chi tiết bảng giá"));
var upsertPriceListItem_createServerFn_handler = createServerRpc({
	id: "1d65efd1f05942982359fa88d6ccd9dfa337bdeb39cfb8126fe308e6748412d7",
	name: "upsertPriceListItem",
	filename: "src/lib/catalog/server.ts"
}, (opts) => upsertPriceListItem.__executeServer(opts));
var upsertPriceListItem = createServerFn({ method: "POST" }).validator(object({
	priceListId: number().int(),
	productId: number().int(),
	unitPrice: number().min(0),
	minQty: number().min(.01).default(1)
})).handler(upsertPriceListItem_createServerFn_handler, async ({ data }) => {
	upsertItem(data);
	return ok({ ok: true }, "Đã lưu dòng giá");
});
var deletePriceListItem_createServerFn_handler = createServerRpc({
	id: "d56258a7db4a7e5ddb1f9913ad9edc427e55b2ca7c58b92c860c5a0401830ab1",
	name: "deletePriceListItem",
	filename: "src/lib/catalog/server.ts"
}, (opts) => deletePriceListItem.__executeServer(opts));
var deletePriceListItem = createServerFn({ method: "POST" }).validator(object({ id: number().int() })).handler(deletePriceListItem_createServerFn_handler, async ({ data }) => {
	removeItem(data.id);
	return ok({ id: data.id }, "Đã gỡ dòng giá");
});
var listCategories_createServerFn_handler = createServerRpc({
	id: "4dc5f03d9bdca876223d52ed05e88ea98ebeb828fff5786f0e0c85d2ffe39bc2",
	name: "listCategories",
	filename: "src/lib/catalog/server.ts"
}, (opts) => listCategories.__executeServer(opts));
var listCategories = createServerFn({ method: "GET" }).validator(object({ categoryType: _enum([
	"LEAD_SOURCE",
	"INDUSTRY",
	"BUSINESS_TYPE",
	"ALL"
]).default("ALL") })).handler(listCategories_createServerFn_handler, async ({ data }) => ok(listCats(data.categoryType), "Danh mục dùng chung"));
var catInput = object({
	categoryType: _enum([
		"LEAD_SOURCE",
		"INDUSTRY",
		"BUSINESS_TYPE"
	]),
	code: string().min(1).max(64),
	name: string().min(1).max(255),
	description: string().max(2e3).nullable().optional(),
	sortOrder: number().int().default(0),
	isActive: boolean().default(true)
});
var createCategory_createServerFn_handler = createServerRpc({
	id: "36a446538a3dfc7408838dfed368247d21fa5d43eb8e9ec8f5d28c2d22a6e821",
	name: "createCategory",
	filename: "src/lib/catalog/server.ts"
}, (opts) => createCategory.__executeServer(opts));
var createCategory = createServerFn({ method: "POST" }).validator(catInput).handler(createCategory_createServerFn_handler, async ({ data }) => ok(addCat(data), "Đã tạo danh mục"));
var updateCategory_createServerFn_handler = createServerRpc({
	id: "b52ec816692d85781666d670dcbb9fbf22d22a9dd4b489dca228aff48de83ff3",
	name: "updateCategory",
	filename: "src/lib/catalog/server.ts"
}, (opts) => updateCategory.__executeServer(opts));
var updateCategory = createServerFn({ method: "POST" }).validator(catInput.extend({ id: number().int() })).handler(updateCategory_createServerFn_handler, async ({ data }) => {
	const { id, ...rest } = data;
	return ok(patchCat(id, rest), "Đã cập nhật danh mục");
});
var deleteCategory_createServerFn_handler = createServerRpc({
	id: "d5d4091a33b11185dae69e098e1cefaeea48bc09fba9e7a8655f1697ab49df9b",
	name: "deleteCategory",
	filename: "src/lib/catalog/server.ts"
}, (opts) => deleteCategory.__executeServer(opts));
var deleteCategory = createServerFn({ method: "POST" }).validator(object({ id: number().int() })).handler(deleteCategory_createServerFn_handler, async ({ data }) => {
	removeCat(data.id);
	return ok({ id: data.id }, "Đã xóa danh mục");
});
//#endregion
export { createCategory_createServerFn_handler, createPriceList_createServerFn_handler, createProduct_createServerFn_handler, deleteCategory_createServerFn_handler, deletePriceListItem_createServerFn_handler, deleteProduct_createServerFn_handler, getCatalogStats_createServerFn_handler, getPriceListDetail_createServerFn_handler, listCategories_createServerFn_handler, listPriceLists_createServerFn_handler, listProducts_createServerFn_handler, updateCategory_createServerFn_handler, updatePriceList_createServerFn_handler, updateProduct_createServerFn_handler, upsertPriceListItem_createServerFn_handler };
