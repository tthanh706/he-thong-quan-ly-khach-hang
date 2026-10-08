import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { r as cn } from "./server-dHE5ZT8-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ui-DURpM7yN.js
var import_jsx_runtime = require_jsx_runtime();
function Button({ className, variant = "primary", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition disabled:opacity-50", variant === "primary" && "bg-primary text-primary-fg hover:bg-primary/90", variant === "ghost" && "text-ink hover:bg-primary/8", variant === "danger" && "bg-danger text-primary-fg hover:bg-danger/90", variant === "line" && "border border-line bg-surface text-ink hover:border-primary/40", className),
		...props
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mb-1.5 block text-muted",
			children: label
		}), children]
	});
}
var inputClass = "min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-ink outline-none focus:border-primary";
function Modal({ title, onClose, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			className: "absolute inset-0",
			"aria-label": "Đóng",
			onClick: onClose
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative z-10 max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-surface p-5 shadow-xl sm:max-w-lg sm:rounded-2xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl text-primary",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					onClick: onClose,
					children: "Đóng"
				})]
			}), children]
		})]
	});
}
function Badge({ children, tone = "ink" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", tone === "ink" && "bg-primary/10 text-primary", tone === "ok" && "bg-ok/15 text-ok", tone === "accent" && "bg-accent/15 text-accent", tone === "muted" && "bg-line text-muted"),
		children
	});
}
//#endregion
export { inputClass as a, Modal as i, Button as n, Field as r, Badge as t };
