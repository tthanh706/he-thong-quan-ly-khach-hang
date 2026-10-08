import { i as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { g as updateCategory, i as createCategory, n as PageHead, p as listCategories, r as cn, s as deleteCategory, t as AppShell } from "./server-dHE5ZT8-.mjs";
import { i as Modal, n as Button, r as Field, t as Badge } from "./ui-DURpM7yN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/categories-BS8PzzX_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TYPES = [
	{
		id: "ALL",
		label: "Tất cả"
	},
	{
		id: "LEAD_SOURCE",
		label: "Nguồn lead"
	},
	{
		id: "INDUSTRY",
		label: "Ngành nghề"
	},
	{
		id: "BUSINESS_TYPE",
		label: "Loại hình"
	}
];
var TYPE_LABEL = {
	LEAD_SOURCE: "Nguồn lead",
	INDUSTRY: "Ngành nghề",
	BUSINESS_TYPE: "Loại hình"
};
var empty = {
	categoryType: "LEAD_SOURCE",
	code: "",
	name: "",
	description: "",
	sortOrder: 10,
	isActive: true
};
function CategoriesPage() {
	const qc = useQueryClient();
	const [tab, setTab] = (0, import_react.useState)("ALL");
	const [draft, setDraft] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const q = useQuery({
		queryKey: ["categories", tab],
		queryFn: () => listCategories({ data: { categoryType: tab } })
	});
	const items = q.data?.data ?? [];
	const save = useMutation({
		mutationFn: async () => {
			if (!draft) return;
			const payload = {
				categoryType: draft.categoryType,
				code: draft.code,
				name: draft.name,
				description: draft.description || null,
				sortOrder: Number(draft.sortOrder),
				isActive: draft.isActive
			};
			if (draft.id) return updateCategory({ data: {
				...payload,
				id: draft.id
			} });
			return createCategory({ data: payload });
		},
		onSuccess: async () => {
			setDraft(null);
			await qc.invalidateQueries({ queryKey: ["categories"] });
			await qc.invalidateQueries({ queryKey: ["stats"] });
		},
		onError: (e) => setError(e.message)
	});
	const remove = useMutation({
		mutationFn: (id) => deleteCategory({ data: { id } }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["categories"] });
			qc.invalidateQueries({ queryKey: ["stats"] });
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHead, {
			title: "Danh mục dùng chung",
			hint: "S2-07: Nguồn lead, Ngành nghề, Loại hình doanh nghiệp. Code unique theo loại.",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => {
					setDraft({
						...empty,
						categoryType: tab === "ALL" ? "LEAD_SOURCE" : tab
					});
					setError(null);
				},
				children: "Thêm danh mục"
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-4 flex flex-wrap gap-2",
			children: TYPES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: cn("min-h-11 rounded-full px-4 text-sm", tab === t.id ? "bg-primary text-primary-fg" : "border border-line bg-surface"),
				onClick: () => setTab(t.id),
				children: t.label
			}, t.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-hidden rounded-2xl border border-line bg-surface",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[640px] text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-primary/5 text-xs uppercase tracking-wide text-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3",
								children: "Loại"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3",
								children: "Mã"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3",
								children: "Tên"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3",
								children: "Thứ tự"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3",
								children: "TT"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-4 py-3" })
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [items.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						colSpan: 6,
						className: "px-4 py-10 text-center text-muted",
						children: q.isLoading ? "Đang tải…" : "Chưa có danh mục."
					}) }), items.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-t border-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: TYPE_LABEL[c.categoryType] })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono text-xs",
								children: c.code
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: c.name }), c.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted",
									children: c.description
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: c.sortOrder
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: c.isActive ? "ok" : "muted",
									children: c.isActive ? "Active" : "Ẩn"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3 text-right",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									onClick: () => {
										setDraft({
											id: c.id,
											categoryType: c.categoryType,
											code: c.code,
											name: c.name,
											description: c.description ?? "",
											sortOrder: c.sortOrder,
											isActive: c.isActive
										});
										setError(null);
									},
									children: "Sửa"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									onClick: () => remove.mutate(c.id),
									children: "Xóa"
								})]
							})
						]
					}, c.id))] })]
				})
			})
		}),
		draft && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			title: draft.id ? "Sửa danh mục" : "Thêm danh mục",
			onClose: () => setDraft(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "grid gap-3",
				onSubmit: (e) => {
					e.preventDefault();
					save.mutate();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Loại",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-ink outline-none focus:border-primary",
							value: draft.categoryType,
							onChange: (e) => setDraft({
								...draft,
								categoryType: e.target.value
							}),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "LEAD_SOURCE",
									children: "Nguồn lead"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "INDUSTRY",
									children: "Ngành nghề"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "BUSINESS_TYPE",
									children: "Loại hình"
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Mã",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-ink outline-none focus:border-primary",
							required: true,
							value: draft.code,
							onChange: (e) => setDraft({
								...draft,
								code: e.target.value
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Tên",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-ink outline-none focus:border-primary",
							required: true,
							value: draft.name,
							onChange: (e) => setDraft({
								...draft,
								name: e.target.value
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Mô tả",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							className: "min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-ink outline-none focus:border-primary py-2",
							rows: 2,
							value: draft.description,
							onChange: (e) => setDraft({
								...draft,
								description: e.target.value
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Thứ tự",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-ink outline-none focus:border-primary",
							type: "number",
							value: draft.sortOrder,
							onChange: (e) => setDraft({
								...draft,
								sortOrder: Number(e.target.value)
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
						}), "Đang sử dụng"]
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
//#endregion
export { CategoriesPage as component };
