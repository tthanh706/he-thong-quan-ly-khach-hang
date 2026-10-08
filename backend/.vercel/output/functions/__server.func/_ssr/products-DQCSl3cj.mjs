import { i as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { h as listProducts, l as deleteProduct, n as PageHead, o as createProduct, t as AppShell, u as formatVnd, v as updateProduct } from "./server-dHE5ZT8-.mjs";
import { a as inputClass, i as Modal, n as Button, r as Field, t as Badge } from "./ui-DURpM7yN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/products-DQCSl3cj.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var empty = {
	sku: "",
	name: "",
	type: "SERVICE",
	unit: "license",
	description: "",
	listPrice: 0,
	isActive: true
};
function ProductsPage() {
	const qc = useQueryClient();
	const [page, setPage] = (0, import_react.useState)(1);
	const [q, setQ] = (0, import_react.useState)("");
	const [type, setType] = (0, import_react.useState)("ALL");
	const [draft, setDraft] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const list = useQuery({
		queryKey: [
			"products",
			page,
			q,
			type
		],
		queryFn: () => listProducts({ data: {
			page,
			perPage: 8,
			q,
			type
		} })
	});
	const meta = list.data?.data.meta;
	const items = list.data?.data.items ?? [];
	const save = useMutation({
		mutationFn: async () => {
			if (!draft) return;
			const payload = {
				sku: draft.sku,
				name: draft.name,
				type: draft.type,
				unit: draft.unit,
				description: draft.description || null,
				listPrice: Number(draft.listPrice),
				currency: "VND",
				isActive: draft.isActive
			};
			if (draft.id) return updateProduct({ data: {
				...payload,
				id: draft.id
			} });
			return createProduct({ data: payload });
		},
		onSuccess: async () => {
			setDraft(null);
			setError(null);
			await qc.invalidateQueries({ queryKey: ["products"] });
			await qc.invalidateQueries({ queryKey: ["stats"] });
		},
		onError: (e) => setError(e.message)
	});
	const remove = useMutation({
		mutationFn: (id) => deleteProduct({ data: { id } }),
		onSuccess: async () => {
			await qc.invalidateQueries({ queryKey: ["products"] });
			await qc.invalidateQueries({ queryKey: ["stats"] });
		}
	});
	const title = (0, import_react.useMemo)(() => draft?.id ? "Sửa sản phẩm / dịch vụ" : "Thêm sản phẩm / dịch vụ", [draft]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHead, {
			title: "Sản phẩm / Dịch vụ",
			hint: "Giám đốc kinh doanh quản lý catalog. SKU duy nhất, giá niêm yết VND, soft delete.",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => {
					setDraft({ ...empty });
					setError(null);
				},
				children: "Thêm mới"
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4 flex flex-col gap-2 sm:flex-row",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: inputClass,
				placeholder: "Tìm SKU hoặc tên…",
				value: q,
				onChange: (e) => {
					setQ(e.target.value);
					setPage(1);
				}
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
				className: inputClass + " sm:max-w-48",
				value: type,
				onChange: (e) => {
					setType(e.target.value);
					setPage(1);
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "ALL",
						children: "Tất cả loại"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "PRODUCT",
						children: "Sản phẩm"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "SERVICE",
						children: "Dịch vụ"
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "overflow-hidden rounded-2xl border border-line bg-surface",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[720px] text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-primary/5 text-xs uppercase tracking-wide text-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3",
								children: "SKU"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3",
								children: "Tên"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3",
								children: "Loại"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3",
								children: "Đơn vị"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3",
								children: "Giá niêm yết"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3",
								children: "TT"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-4 py-3" })
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [items.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						colSpan: 7,
						className: "px-4 py-10 text-center text-muted",
						children: list.isLoading ? "Đang tải…" : "Chưa có bản ghi."
					}) }), items.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						p,
						onEdit: () => {
							setDraft({
								id: p.id,
								sku: p.sku,
								name: p.name,
								type: p.type,
								unit: p.unit,
								description: p.description ?? "",
								listPrice: p.listPrice,
								isActive: p.isActive
							});
							setError(null);
						},
						onDelete: () => remove.mutate(p.id)
					}, p.id))] })]
				})
			}), meta && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between border-t border-line px-4 py-3 text-sm text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					"Trang ",
					meta.page,
					"/",
					meta.lastPage,
					" · ",
					meta.total,
					" bản ghi"
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "line",
						disabled: page <= 1,
						onClick: () => setPage((p) => p - 1),
						children: "Trước"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "line",
						disabled: page >= meta.lastPage,
						onClick: () => setPage((p) => p + 1),
						children: "Sau"
					})]
				})]
			})]
		}),
		draft && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			title,
			onClose: () => setDraft(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "grid gap-3",
				onSubmit: (e) => {
					e.preventDefault();
					save.mutate();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "SKU",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-ink outline-none focus:border-primary",
							value: draft.sku,
							required: true,
							onChange: (e) => setDraft({
								...draft,
								sku: e.target.value
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Tên",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-ink outline-none focus:border-primary",
							value: draft.name,
							required: true,
							onChange: (e) => setDraft({
								...draft,
								name: e.target.value
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Loại",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-ink outline-none focus:border-primary",
								value: draft.type,
								onChange: (e) => setDraft({
									...draft,
									type: e.target.value
								}),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "PRODUCT",
									children: "Sản phẩm"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "SERVICE",
									children: "Dịch vụ"
								})]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Đơn vị",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-ink outline-none focus:border-primary",
								value: draft.unit,
								onChange: (e) => setDraft({
									...draft,
									unit: e.target.value
								})
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Giá niêm yết (VND)",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-ink outline-none focus:border-primary",
							type: "number",
							min: 0,
							value: draft.listPrice,
							onChange: (e) => setDraft({
								...draft,
								listPrice: Number(e.target.value)
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Mô tả",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							className: "min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-ink outline-none focus:border-primary py-2",
							rows: 3,
							value: draft.description,
							onChange: (e) => setDraft({
								...draft,
								description: e.target.value
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center gap-2 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: draft.isActive,
							onChange: (e) => setDraft({
								...draft,
								isActive: e.target.checked
							})
						}), "Đang kinh doanh"]
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-danger",
						children: error
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex justify-end gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "ghost",
							onClick: () => setDraft(null),
							children: "Hủy"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							disabled: save.isPending,
							children: "Lưu"
						})]
					})
				]
			})
		})
	] });
}
function Row({ p, onEdit, onDelete }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
		className: "border-t border-line",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-4 py-3 font-mono text-xs",
				children: p.sku
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-4 py-3",
				children: p.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-4 py-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: p.type === "SERVICE" ? "accent" : "ink",
					children: p.type === "SERVICE" ? "Dịch vụ" : "Sản phẩm"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-4 py-3",
				children: p.unit
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-4 py-3",
				children: formatVnd(p.listPrice)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-4 py-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: p.isActive ? "ok" : "muted",
					children: p.isActive ? "Active" : "Ẩn"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
				className: "px-4 py-3 text-right",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					onClick: onEdit,
					children: "Sửa"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					onClick: onDelete,
					children: "Xóa"
				})]
			})
		]
	});
}
//#endregion
export { ProductsPage as component };
