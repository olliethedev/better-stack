import { createClient } from "better-call/client";

interface CreateApiClientOptions {
	baseURL?: string;
	basePath?: string;
}

/**
 * Creates a Better Call API client with proper URL handling for both server and client side
 * @param options - Configuration options
 * @param options.baseURL - The base URL (e.g., 'http://localhost:3000'). If not provided, uses relative URLs (same domain)
 * @param options.basePath - The API base path (defaults to '/api')
 */
export function createApiClient(options?: CreateApiClientOptions) {
	const { baseURL = "", basePath = "/api" } = options ?? {};

	// Normalize baseURL - remove trailing slash if present
	const normalizedBaseURL = baseURL ? baseURL.replace(/\/$/, "") : "";
	// Normalize basePath - ensure it starts with / and doesn't end with /
	const normalizedBasePath = basePath.startsWith("/")
		? basePath
		: `/${basePath}`;
	const finalBasePath = normalizedBasePath.replace(/\/$/, "");

	// If baseURL is not provided, apiPath is just the basePath (same domain, relative URL)
	const apiPath = normalizedBaseURL + finalBasePath;

	// Use 'any' for now to allow flexibility across plugins
	// In production, this would be typed from the composed API routes
	return createClient<any>({
		baseURL: apiPath,
	});
}

/**
 * Helper to get the server-side baseURL
 * On the server, we need an absolute URL. On the client, we can use relative URLs.
 */
export function getServerBaseURL(): string | undefined {
	if (typeof window === "undefined") {
		// Server-side: use environment variable or default to localhost
		return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
	}
	// Client-side: return undefined to use relative URLs
	return undefined;
}
