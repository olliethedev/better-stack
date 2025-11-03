import { defineBuildConfig } from "unbuild";

function withExcludedPluginPostbuildExternal(prevExternal: any) {
	const postbuildMatcher = /plugins\/[^/]+\/postbuild\.(?:js|cjs|mjs|ts)$/;
	return (id: any, importer: any, isResolved: any) => {
		const isPostbuild =
			(typeof id === "string" && postbuildMatcher.test(id)) ||
			(typeof importer === "string" && postbuildMatcher.test(importer));
		const prev =
			typeof prevExternal === "function"
				? prevExternal(id, importer, isResolved)
				: Array.isArray(prevExternal)
					? prevExternal.includes(id)
					: !!prevExternal;
		return prev || isPostbuild;
	};
}

function createUseClientBanner() {
	return (chunk: any) => {
		// Add "use client" to any plugin client-side bundles:
		// - plugins/*/client/components/**
		// - plugins/*/client/hooks/**
		// - plugins/*/client/** (excluding the top-level client/index.* entry)
		// Also add to shared chunks that include modules from plugins/*/client/**
		// Also add to top-level client/components/** (outside of plugins)
		// Also add to shared chunks that include top-level client/components/**
		// Also add to context/** (BetterStackProvider and hooks use React context)
		// Also add to chunks/** that include any client-side modules (for lazy-loaded components)
		const isPluginClientComponentOrHook =
			chunk.fileName.includes("plugins/") &&
			(chunk.fileName.includes("/client/components/") ||
				chunk.fileName.includes("/client/hooks/"));

		const isOtherClientChunkExcludingIndex =
			chunk.fileName.includes("plugins/") &&
			chunk.fileName.includes("/client/") &&
			// Exclude BOTH plugins/client/index.* (plugin utilities) AND plugins/*/client/index.* (plugin entry points)
			!/plugins\/client\/index\./.test(chunk.fileName) &&
			!/plugins\/[^/]+\/client\/index\./.test(chunk.fileName);

		const isSharedChunkUsingAnyPluginClient =
			chunk.fileName.includes("shared/") &&
			chunk.moduleIds?.some(
				(id: string) => id.includes("plugins/") && id.includes("/client/"),
			);

		const isTopLevelClientComponents =
			(chunk.fileName.includes("/client/components/") ||
				chunk.fileName.startsWith("client/components/")) &&
			!chunk.fileName.includes("plugins/");

		const isSharedChunkUsingTopLevelClientComponents =
			chunk.fileName.includes("shared/") &&
			chunk.moduleIds?.some(
				(id: string) =>
					id.includes("/client/components/") && !id.includes("plugins/"),
			);

		const isContextModule =
			chunk.fileName.includes("/context/") ||
			chunk.fileName.startsWith("context/");

		// Handle lazy-loaded chunks in chunks/** directory
		const isLazyChunkUsingClientModules =
			chunk.fileName.includes("chunks/") &&
			chunk.moduleIds?.some(
				(id: string) =>
					id.includes("/client/") ||
					id.includes("/components/") ||
					id.includes("/hooks/") ||
					id.includes("/pages/"),
			);

		if (
			isPluginClientComponentOrHook ||
			isOtherClientChunkExcludingIndex ||
			isSharedChunkUsingAnyPluginClient ||
			isTopLevelClientComponents ||
			isSharedChunkUsingTopLevelClientComponents ||
			isContextModule ||
			isLazyChunkUsingClientModules
		) {
			return '"use client";';
		}
		return "";
	};
}

export default defineBuildConfig({
	rollup: {
		emitCJS: true,
		esbuild: {
			treeShaking: true,
			jsx: "automatic",
			jsxImportSource: "react",
		},
		// Attach visualizer when ANALYZE env var is set
		dts: {
			// no-op, placeholder to keep object shape consistent across unbuild versions
		} as any,
	},
	declaration: true,
	outDir: "dist",
	clean: true,
	failOnWarn: false,
	externals: [
		// peerDependencies
		"react",
		"react-dom",
		"react/jsx-runtime",
		"@tanstack/react-query",
		"sonner",
		// test/build-time deps kept external
		"vitest",
		"@vitest/runner",
		"@vitest/utils",
		"@vitest/expect",
		"@vitest/snapshot",
		"@vitest/spy",
		"chai",
		"@babel/types",
		"@babel/parser",
	],
	entries: [
		"./src/index.ts",
		"./src/api/index.ts",
		"./src/client/index.ts",
		"./src/context/index.ts",
		"./src/client/components/index.tsx",
		// plugin development entries
		"./src/plugins/api/index.ts",
		"./src/plugins/client/index.ts",
		// blog plugin entries
		"./src/plugins/blog/api/index.ts",
		"./src/plugins/blog/client/index.ts",
		"./src/plugins/blog/client/components/index.tsx",
		"./src/plugins/blog/client/hooks/index.tsx",
		"./src/plugins/blog/query-keys.ts",
	],
	hooks: {
		"rollup:options"(_ctx, options) {
			// Ensure per-plugin postbuild scripts are never bundled
			options.external = withExcludedPluginPostbuildExternal(options.external);

			const outputs = Array.isArray(options.output)
				? (options.output.filter(Boolean) as typeof options.output)
				: options.output
					? [options.output]
					: [];

			outputs.forEach((output) => {
				if (output) {
					output.banner = createUseClientBanner();
				}
			});

			// Add bundle visualizer when ANALYZE is truthy
			const analyze = process.env.ANALYZE && process.env.ANALYZE !== "0";
			if (analyze) {
				// options.plugins can be undefined in some shapes; normalize then push
				const existing = Array.isArray((options as any).plugins)
					? (options as any).plugins
					: [];
				let _visualizer: any;
				try {
					// eslint-disable-next-line @typescript-eslint/no-var-requires
					_visualizer = (require as any)("rollup-plugin-visualizer").visualizer;
				} catch (_err) {
					_visualizer = null;
				}
				if (_visualizer) {
					const plugin = _visualizer({
						filename: "dist/stats.html",
						template: "treemap",
						gzipSize: true,
						brotliSize: true,
						title: "better-stack bundle analysis",
						open: false,
					});
					(options as any).plugins = [...existing, plugin];
				} else {
					(options as any).plugins = existing;
				}
			}

			if (outputs.length === 0) {
				options.output = undefined;
			} else if (outputs.length === 1) {
				options.output = outputs[0]!;
			} else {
				options.output = outputs;
			}
		},
	},
});
