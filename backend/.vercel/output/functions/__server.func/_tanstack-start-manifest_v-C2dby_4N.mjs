//#region node_modules/.nitro/vite/services/ssr/assets/_tanstack-start-manifest_v-C2dby_4N.js
var tsrStartManifest = () => ({ routes: {
	__root__: {
		filePath: "/workspace/src/routes/__root.tsx",
		children: [
			"/",
			"/categories",
			"/price-lists",
			"/products"
		],
		preloads: ["/assets/index-C14iOTRQ.js"],
		scripts: [{ attrs: {
			type: "module",
			async: !0,
			src: "/assets/index-C14iOTRQ.js"
		} }]
	},
	"/": {
		filePath: "/workspace/src/routes/index.tsx",
		children: void 0,
		preloads: ["/assets/routes-CY-ChLAE.js", "/assets/server-DZD24vbZ.js"]
	},
	"/categories": {
		filePath: "/workspace/src/routes/categories.tsx",
		children: void 0,
		preloads: [
			"/assets/categories-BH5BN83i.js",
			"/assets/server-DZD24vbZ.js",
			"/assets/ui-BeXYEFC7.js"
		]
	},
	"/price-lists": {
		filePath: "/workspace/src/routes/price-lists.tsx",
		children: ["/price-lists/$id"],
		preloads: [
			"/assets/price-lists-BgNiXmt7.js",
			"/assets/server-DZD24vbZ.js",
			"/assets/ui-BeXYEFC7.js"
		]
	},
	"/products": {
		filePath: "/workspace/src/routes/products.tsx",
		children: void 0,
		preloads: [
			"/assets/products-Dj6YW5Kd.js",
			"/assets/server-DZD24vbZ.js",
			"/assets/ui-BeXYEFC7.js"
		]
	},
	"/price-lists/$id": {
		filePath: "/workspace/src/routes/price-lists.$id.tsx",
		children: void 0,
		preloads: ["/assets/price-lists._id-Dt6Pua-x.js"]
	}
} });
//#endregion
export { tsrStartManifest };
