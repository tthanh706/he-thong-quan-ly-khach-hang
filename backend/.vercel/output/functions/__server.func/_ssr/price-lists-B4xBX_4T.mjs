import { i as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as updatePriceList, a as createPriceList, m as listPriceLists, n as PageHead, t as AppShell } from "./server-dHE5ZT8-.mjs";
import { i as Modal, n as Button, r as Field, t as Badge } from "./ui-DURpM7yN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/price-lists-B4xBX_4T.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var empty = {
	code: "",
	name: "",
	isStandard: false,
	isActive: true,
	effectiveFrom: "2026-01-01",
	effectiveTo: "",
	note: ""
};
function PriceListsPage() {
	const qc = useQueryClient();
	const [draft, setDraft] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const q = useQuery({
		queryKey: ["price-lists"],
		queryFn: () => listPriceLists()
	});
	const items = q.data?.data ?? [];
	const save = useMutation({
		mutationFn: async () => {
			if (!draft) return;
			const payload = {
				code: draft.code,
				name: draft.name,
				currency: "VND",
				isStandard: draft.isStandard,
				isActive: draft.isActive,
				effectiveFrom: draft.effectiveFrom || null,
				effectiveTo: draft.effectiveTo || null,
				note: draft.note || null
			};
			if (draft.id) return updatePriceList({ data: {
				...payload,
				id: draft.id
			} });
			return createPriceList({ data: payload });
		},
		onSuccess: async () => {
			setDraft(null);
			await qc.invalidateQueries({ queryKey: ["price-lists"] });
			await qc.invalidateQueries({ queryKey: ["stats"] });
		},
		onError: (e) => setError(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHead, {
			title: "Bảng giá niêm yết",
			hint: "Chỉ một bảng được đánh dấu chuẩn. Khi bật is_standard, các bảng khác tự hạ cờ.",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => {
					setDraft({ ...empty });
					setError(null);
				},
				children: "Thêm bảng giá"
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3",
			children: [items.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-2xl border border-line bg-surface p-8 text-center text-muted",
				children: q.isLoading ? "Đang tải…" : "Chưa có bảng giá."
			}), items.map((pl) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
				className: "rounded-2xl border border-line bg-surface p-5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-display text-2xl text-primary",
									children: pl.name
								}),
								pl.isStandard && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: "accent",
									children: "Niêm yết chuẩn"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: pl.isActive ? "ok" : "muted",
									children: pl.isActive ? "Hiệu lực" : "Ngưng"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 font-mono text-xs text-muted",
							children: pl.code
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-sm text-muted",
							children: [
								pl.effectiveFrom ?? "—",
								" → ",
								pl.effectiveTo ?? "không hạn",
								" · ",
								pl.itemCount,
								" dòng giá"
							]
						}),
						pl.note && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm",
							children: pl.note
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "line",
							onClick: () => {
								setDraft({
									id: pl.id,
									code: pl.code,
									name: pl.name,
									isStandard: pl.isStandard,
									isActive: pl.isActive,
									effectiveFrom: pl.effectiveFrom ?? "",
									effectiveTo: pl.effectiveTo ?? "",
									note: pl.note ?? ""
								});
								setError(null);
							},
							children: "Sửa"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/price-lists/$id",
							params: { id: String(pl.id) },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { children: "Chi tiết dòng giá" })
						})]
					})]
				})
			}, pl.id))]
		}),
		draft && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			title: draft.id ? "Sửa bảng giá" : "Thêm bảng giá",
			onClose: () => setDraft(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "grid gap-3",
				onSubmit: (e) => {
					e.preventDefault();
					save.mutate();
				},
				children: [
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
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Hiệu lực từ",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-ink outline-none focus:border-primary",
								type: "date",
								value: draft.effectiveFrom,
								onChange: (e) => setDraft({
									...draft,
									effectiveFrom: e.target.value
								})
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Hiệu lực đến",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-ink outline-none focus:border-primary",
								type: "date",
								value: draft.effectiveTo,
								onChange: (e) => setDraft({
									...draft,
									effectiveTo: e.target.value
								})
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Ghi chú",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							className: "min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-ink outline-none focus:border-primary py-2",
							rows: 3,
							value: draft.note,
							onChange: (e) => setDraft({
								...draft,
								note: e.target.value
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center gap-2 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: draft.isStandard,
							onChange: (e) => setDraft({
								...draft,
								isStandard: e.target.checked
							})
						}), "Đặt làm bảng giá niêm yết chuẩn"]
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
						}), "Đang hiệu lực"]
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
export { PriceListsPage as component };
