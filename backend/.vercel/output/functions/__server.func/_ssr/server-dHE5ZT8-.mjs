import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { b as Link, p as useRouterState } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as object, i as number, n as boolean, o as string, t as _enum } from "../_libs/zod.mjs";
import { a as Boxes, i as FolderTree, n as Tags, r as LayoutDashboard } from "../_libs/lucide-react.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/server-dHE5ZT8-.js
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function formatVnd(n) {
	return new Intl.NumberFormat("vi-VN", {
		style: "currency",
		currency: "VND",
		maximumFractionDigits: 0
	}).format(n);
}
var NAV = [
	{
		to: "/",
		label: "Tổng quan",
		icon: LayoutDashboard
	},
	{
		to: "/products",
		label: "Sản phẩm / Dịch vụ",
		icon: Boxes
	},
	{
		to: "/price-lists",
		label: "Bảng giá niêm yết",
		icon: Tags
	},
	{
		to: "/categories",
		label: "Danh mục dùng chung",
		icon: FolderTree
	}
];
function AppShell({ children }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grain min-h-dvh",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "border-b border-line bg-surface/90 backdrop-blur",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-baseline gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-xl tracking-tight text-primary",
						children: "Nautilus CRM"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "hidden text-xs uppercase tracking-[0.18em] text-muted sm:inline",
						children: "Nhóm 2 · S2-05 / S2-07"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-right text-xs text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-medium text-ink",
						children: "Giám đốc kinh doanh"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "Sprint 2 · Catalog" })]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 pb-2",
				children: NAV.map((item) => {
					const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
					const Icon = item.icon;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: item.to,
						className: cn("flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3 text-sm transition", active ? "bg-primary text-primary-fg" : "text-muted hover:bg-primary/8 hover:text-ink"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), item.label]
					}, item.to);
				})
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "mx-auto max-w-6xl px-4 py-6",
			children
		})]
	});
}
function PageHead({ title, hint, action }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl tracking-tight text-primary",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 max-w-2xl text-sm text-muted",
			children: hint
		})] }), action]
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
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
var getCatalogStats = createServerFn({ method: "GET" }).handler(createSsrRpc("81da93c2742b620e3b57cff8a4a66572fdf693d0f2e85433e7805e3c1845ab01"));
var listProducts = createServerFn({ method: "GET" }).validator(listQuery).handler(createSsrRpc("27f32f6f8a39373260e99fa9f5993eeba5dc91f95d32726c026635fe5f74be5b"));
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
var createProduct = createServerFn({ method: "POST" }).validator(productInput).handler(createSsrRpc("4f41b909c2d360997ddf9f2026ec97ad58abd13b7252a8bd49142c8d8c61dc13"));
var updateProduct = createServerFn({ method: "POST" }).validator(productInput.extend({ id: number().int() })).handler(createSsrRpc("711b353cd5dea199de2e8229e092fcd350a8fbfe25e3c5c2c6448e018f7ae560"));
var deleteProduct = createServerFn({ method: "POST" }).validator(object({ id: number().int() })).handler(createSsrRpc("17ee3e7cdf266094881a59363d7b3e33b1c8fa618440f6761807a55a4e5d0f90"));
var listPriceLists = createServerFn({ method: "GET" }).handler(createSsrRpc("7d37d6f1603d3625b36564c9eabe7a4bdcbe5fb57066b37df385cacb059c1662"));
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
var createPriceList = createServerFn({ method: "POST" }).validator(priceListInput).handler(createSsrRpc("528faf25ac186962d4d8f574bab1a46e1dee6defbfb61a03425f5788b1fa7521"));
var updatePriceList = createServerFn({ method: "POST" }).validator(priceListInput.extend({ id: number().int() })).handler(createSsrRpc("d9b1cad323e9d2bbc4ead4fc8bdab4a2228c0f904a796e0314afd256e3050864"));
var getPriceListDetail = createServerFn({ method: "GET" }).validator(object({ id: number().int() })).handler(createSsrRpc("289d9e9acd585304733bc31bc80608428c65fc7b0d6d942267980417ff7d8012"));
var upsertPriceListItem = createServerFn({ method: "POST" }).validator(object({
	priceListId: number().int(),
	productId: number().int(),
	unitPrice: number().min(0),
	minQty: number().min(.01).default(1)
})).handler(createSsrRpc("1d65efd1f05942982359fa88d6ccd9dfa337bdeb39cfb8126fe308e6748412d7"));
var deletePriceListItem = createServerFn({ method: "POST" }).validator(object({ id: number().int() })).handler(createSsrRpc("d56258a7db4a7e5ddb1f9913ad9edc427e55b2ca7c58b92c860c5a0401830ab1"));
var listCategories = createServerFn({ method: "GET" }).validator(object({ categoryType: _enum([
	"LEAD_SOURCE",
	"INDUSTRY",
	"BUSINESS_TYPE",
	"ALL"
]).default("ALL") })).handler(createSsrRpc("4dc5f03d9bdca876223d52ed05e88ea98ebeb828fff5786f0e0c85d2ffe39bc2"));
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
var createCategory = createServerFn({ method: "POST" }).validator(catInput).handler(createSsrRpc("36a446538a3dfc7408838dfed368247d21fa5d43eb8e9ec8f5d28c2d22a6e821"));
var updateCategory = createServerFn({ method: "POST" }).validator(catInput.extend({ id: number().int() })).handler(createSsrRpc("b52ec816692d85781666d670dcbb9fbf22d22a9dd4b489dca228aff48de83ff3"));
var deleteCategory = createServerFn({ method: "POST" }).validator(object({ id: number().int() })).handler(createSsrRpc("d5d4091a33b11185dae69e098e1cefaeea48bc09fba9e7a8655f1697ab49df9b"));
//#endregion
export { updatePriceList as _, createPriceList as a, deletePriceListItem as c, getCatalogStats as d, getPriceListDetail as f, updateCategory as g, listProducts as h, createCategory as i, deleteProduct as l, listPriceLists as m, PageHead as n, createProduct as o, listCategories as p, cn as r, deleteCategory as s, AppShell as t, formatVnd as u, updateProduct as v, upsertPriceListItem as y };
