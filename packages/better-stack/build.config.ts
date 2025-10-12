import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
	rollup: {
		emitCJS: true,
		inlineDependencies: false,
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
	hooks: {
		"rollup:options": (_ctx, options) => {
			// Preserve "use client" directives for client-side modules
			if (Array.isArray(options.plugins)) {
				options.plugins.push({
					name: "preserve-use-client",
					renderChunk(code, chunk) {
						// Add "use client" to files that originally had it
						if (
							chunk.facadeModuleId?.includes("context/index") ||
							chunk.facadeModuleId?.includes("plugins/todos/client") ||
							chunk.facadeModuleId?.includes("plugins/todos/hooks") ||
							chunk.facadeModuleId?.includes("plugins/todos/components")
						) {
							return `"use client";\n${code}`;
						}
						return code;
					},
				});
			}
		},
	},
	externals: [
		// peerDependencies
		"react",
		"react-dom",
		"react/jsx-runtime",
		"@tanstack/react-query",
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
		"./src/context/index.tsx",
		"./src/plugins/todos/api.ts",
		"./src/plugins/todos/client.tsx",
	],
});
