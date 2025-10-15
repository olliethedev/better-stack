import { expect, test } from "@playwright/test";

test("page renders", async ({ page }) => {
	const errors: string[] = [];
	page.on("console", (msg) => {
		if (msg.type() === "error") errors.push(msg.text());
	});

	await page.goto("/pages/todos", { waitUntil: "networkidle" });
	await expect(page).toHaveTitle(/Create Next App/i);
});
