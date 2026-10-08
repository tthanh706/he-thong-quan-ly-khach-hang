import { i as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as deletePriceListItem, f as getPriceListDetail, h as listProducts, n as PageHead, t as AppShell, u as formatVnd, y as upsertPriceListItem } from "./server-dHE5ZT8-.mjs";
import { i as Modal, n as Button, r as Field, t as Badge } from "./ui-DURpM7yN.mjs";
import { n as Route } from "./router-COeKxOIH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/price-lists._id-DMYLnYyK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function DetailPage() {
	const { id } = Route.useParams();
	const listId = Number(id);
	const qc = useQueryClient();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [productId, setProductId] = (0, import_react.useState)("");
	const [unitPrice, setUnitPrice] = (0, import_react.useState)(0);
	const [minQty, setMinQty] = (0, import_react.useState)(1);
	const [error, setError] = (0, import_react.useState)(null);
	const detail = useQuery({
		queryKey: ["price-list", listId],
		queryFn: () => getPriceListDetail({ data: { id: listId } })
	});
	const products = useQuery({
		queryKey: ["products-all"],
		queryFn: () => listProducts({ data: {
			page: 1,
			perPage: 50,
			type: "ALL"
		} })
	});
	const save = useMutation({
		mutationFn: () => upsertPriceListItem({ data: {
			priceListId: listId,
			productId: Number(productId),
			unitPrice,
			minQty
		} }),
		onSuccess: async () => {
			setOpen(false);
			await qc.invalidateQueries({ queryKey: ["price-list", listId] });
		},
		onError: (e) => setError(e.message)
	});
	const remove = useMutation({
		mutationFn: (itemId) => deletePriceListItem({ data: { id: itemId } }),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["price-list", listId] })
	});
	const pack = detail.data?.data;
	const list = pack?.list;
	const items = pack?.items ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHead, {
			title: list?.name ?? "Chi tiết bảng giá",
			hint: list ? `${list.code} · ${list.currency}` : "Đang tải…",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/price-lists",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "line",
						children: "Quay lại"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => {
						setOpen(true);
						setError(null);
						const first = products.data?.data.items[0];
						setProductId(first?.id ?? "");
						setUnitPrice(first?.listPrice ?? 0);
						setMinQty(1);
					},
					children: "Thêm dòng giá"
				})]
			})
		}),
		list && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4 flex flex-wrap gap-2",
			children: [list.isStandard && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: "accent",
				children: "Niêm yết chuẩn"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: list.isActive ? "ok" : "muted",
				children: list.isActive ? "Hiệu lực" : "Ngưng"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-hidden rounded-2xl border border-line bg-surface",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[680px] text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-primary/5 text-xs uppercase tracking-wide text-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3",
								children: "SKU"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3",
								children: "Sản phẩm"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3",
								children: "Loại"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3",
								children: "SL tối thiểu"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3",
								children: "Đơn giá"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-4 py-3" })
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [items.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						colSpan: 6,
						className: "px-4 py-10 text-center text-muted",
						children: "Chưa có dòng giá."
					}) }), items.map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-t border-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono text-xs",
								children: it.productSku
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: it.productName
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: it.productType === "SERVICE" ? "Dịch vụ" : "Sản phẩm" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: it.minQty
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: formatVnd(it.unitPrice)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 text-right",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									onClick: () => remove.mutate(it.id),
									children: "Gỡ"
								})
							})
						]
					}, it.id))] })]
				})
			})
		}),
		open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			title: "Thêm / cập nhật dòng giá",
			onClose: () => setOpen(false),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "grid gap-3",
				onSubmit: (e) => {
					e.preventDefault();
					save.mutate();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Sản phẩm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-ink outline-none focus:border-primary",
							value: productId,
							onChange: (e) => {
								const idn = Number(e.target.value);
								setProductId(idn);
								const p = products.data?.data.items.find((x) => x.id === idn);
								if (p) setUnitPrice(p.listPrice);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "Chọn…"
							}), products.data?.data.items.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
								value: p.id,
								children: [
									p.sku,
									" — ",
									p.name
								]
							}, p.id))]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Đơn giá (VND)",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-ink outline-none focus:border-primary",
							type: "number",
							min: 0,
							value: unitPrice,
							onChange: (e) => setUnitPrice(Number(e.target.value))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Số lượng tối thiểu",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-ink outline-none focus:border-primary",
							type: "number",
							min: .01,
							step: "0.01",
							value: minQty,
							onChange: (e) => setMinQty(Number(e.target.value))
						})
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-danger",
						children: error
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-end gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "ghost",
							onClick: () => setOpen(false),
							children: "Hủy"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							disabled: !productId || save.isPending,
							children: "Lưu"
						})]
					})
				]
			})
		})
	] });
}
//#endregion
export { DetailPage as component };
