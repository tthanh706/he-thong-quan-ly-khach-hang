import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Boxes, i as FolderTree, n as Tags } from "../_libs/lucide-react.mjs";
import { d as getCatalogStats, n as PageHead, t as AppShell } from "./server-dHE5ZT8-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BiddC9Gn.js
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	const s = useQuery({
		queryKey: ["stats"],
		queryFn: () => getCatalogStats()
	}).data?.data;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHead, {
			title: "Catalog kinh doanh",
			hint: "S2-05 Quản lý sản phẩm / dịch vụ & bảng giá niêm yết. S2-07 Khai báo danh mục dùng chung: nguồn lead, ngành nghề, loại hình."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Sản phẩm",
					value: s?.productCount
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Dịch vụ",
					value: s?.serviceCount
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Bảng giá",
					value: s?.priceListCount
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Danh mục dùng chung",
					value: s?.categoryCount
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 grid gap-4 md:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					to: "/products",
					icon: Boxes,
					title: "Sản phẩm / Dịch vụ",
					body: "SKU, đơn vị, giá niêm yết, trạng thái. Soft delete, không trùng SKU.",
					api: "GET /api/v1/products"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					to: "/price-lists",
					icon: Tags,
					title: "Bảng giá niêm yết",
					body: "Một bảng chuẩn toàn hệ thống. Có thể tạo bảng Enterprise với giá điều chỉnh.",
					api: "GET /api/v1/price-lists"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					to: "/categories",
					icon: FolderTree,
					title: "Danh mục dùng chung",
					body: "LeadSource, Industry, BusinessType — dùng cho Lead, Customer, Opportunity.",
					api: "GET /api/v1/common-categories"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-10 rounded-2xl border border-line bg-surface p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl text-primary",
					children: "Backend Laravel 13 · PHP 8.3"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 max-w-3xl text-sm text-muted",
					children: [
						"Mã nguồn PHP nằm trong thư mục ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
							className: "text-ink",
							children: "laravel/"
						}),
						" theo Clean API: Controller mỏng, FormRequest, Service, JsonResource, Policy, Enum, Migration snake_case. Ứng dụng preview này chạy cùng contract JSON:",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
							className: "text-ink",
							children: `{ success, data, message }`
						}),
						"."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-3 list-disc space-y-1 pl-5 text-sm text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "ProductController / ProductService / CreateProductRequest" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "PriceListController + PriceListItem (bảng giá chuẩn is_standard)" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "CommonCategoryController — category_type LEAD_SOURCE | INDUSTRY | BUSINESS_TYPE" })
					]
				})
			]
		})
	] });
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-line bg-surface p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-xs uppercase tracking-wider text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 font-display text-4xl text-primary",
			children: value ?? "—"
		})]
	});
}
function Card({ to, icon: Icon, title, body, api }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		className: "block rounded-2xl border border-line bg-surface p-5 transition hover:border-primary/40",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5 text-accent" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-3 font-display text-xl text-primary",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: body
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 font-mono text-xs text-accent",
				children: api
			})
		]
	});
}
//#endregion
export { Home as component };
