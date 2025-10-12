import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
	rollup: {
		emitCJS: true,
		inlineDependencies: false,
		esbuild: {
			treeShaking: true,
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
