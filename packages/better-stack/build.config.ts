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
		const isPluginClientComponentOrHook =
			chunk.fileName.includes("plugins/") &&
			(chunk.fileName.includes("/client/components/") ||
				chunk.fileName.includes("/client/hooks/"));

		const isOtherClientChunkExcludingIndex =
			chunk.fileName.includes("plugins/") &&
			chunk.fileName.includes("/client/") &&
			!/plugins\/[^/]+\/client\/index\./.test(chunk.fileName);

		const isSharedChunkUsingAnyPluginClient =
			chunk.fileName.includes("shared/") &&
			chunk.moduleIds?.some(
				(id: string) => id.includes("plugins/") && id.includes("/client/"),
			);

		if (
			isPluginClientComponentOrHook ||
			isOtherClientChunkExcludingIndex ||
			isSharedChunkUsingAnyPluginClient
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
		"./src/plugins/index.ts",
		// blog plugin entries
		"./src/plugins/blog/api/index.ts",
		"./src/plugins/blog/client/index.ts",
		"./src/plugins/blog/client/components/index.tsx",
		"./src/plugins/blog/client/hooks/index.tsx",
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
