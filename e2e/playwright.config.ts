import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./tests",
	timeout: 90_000,
	forbidOnly: !!process.env.CI,
	outputDir: "../test-results",
	reporter: process.env.CI
		? [["list"], ["html", { open: "never" }]]
		: [["list"]],
	expect: {
		timeout: 10_000,
	},
	retries: process.env["CI"] ? 2 : 0,
	use: {
		trace: "retain-on-failure",
		video: "retain-on-failure",
		screenshot: "only-on-failure",
		actionTimeout: 15_000,
		navigationTimeout: 30_000,
		baseURL: "http://localhost:3000",
	},
	webServer: [
		// Next.js with memory provider and custom plugin
		{
			command: "pnpm -F examples/nextjs run start:e2e",
			port: 3003,
			reuseExistingServer: !process.env["CI"],
			timeout: 120_000,
			stdout: "pipe",
			stderr: "pipe",
			env: {
				...process.env,
				PORT: "3003",
				HOST: "127.0.0.1",
				BASE_URL: "http://localhost:3003",
				NEXT_PUBLIC_BASE_URL: "http://localhost:3003",
			},
		},
		{
			command: "pnpm -F examples/tanstack run start:e2e",
			port: 3004,
			reuseExistingServer: !process.env["CI"],
			timeout: 120_000,
			stdout: "pipe",
			stderr: "pipe",
			env: {
				...process.env,
				PORT: "3004",
				HOST: "127.0.0.1",
				BASE_URL: "http://localhost:3004",
			},
		},
	],
	projects: [
		{
			name: "nextjs:memory",
			use: { baseURL: "http://localhost:3003" },
			testMatch: ["**/*.todos.spec.ts", "**/*.blog.spec.ts"],
		},
		{
			name: "tanstack:memory",
			use: { baseURL: "http://localhost:3004" },
			testMatch: ["**/*.blog.spec.ts"],
		},
	],
});
