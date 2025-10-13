/**
 * Plugin utilities and types for building standalone plugins
 *
 * This module exports everything needed to create custom plugins
 * for Better Stack outside of this package.
 *
 * Note: Backend and Client plugins are separate to prevent SSR issues
 * and enable better code splitting. Import them separately:
 * - Backend: import type { BackendPlugin } from "@olliethedev/better-stack/plugins"
 * - Client: import type { ClientPlugin } from "@olliethedev/better-stack/plugins"
 */

import type { BackendPlugin, ClientPlugin } from "../types";
import type { Route } from "@olliethedev/yar";
import type { Endpoint } from "better-call";

// Export utility functions
export { createApiClient, getServerBaseURL } from "./utils";

// Export all plugin-related types
export type {
	BackendPlugin,
	ClientPlugin,
	PluginOverrides,
	InferPluginOverrides,
} from "../types";

// Re-export Better DB types needed for plugins
export type { Adapter, DatabaseDefinition, DbPlugin } from "@better-db/core";

// Re-export Better Call types needed for plugins
export type { Endpoint, Router } from "better-call";

// Re-export Yar types needed for plugins
export type { Route } from "@olliethedev/yar";

/**
 * Helper to define a client plugin with full type inference
 *
 * Automatically infers route keys, hook names, and their types without needing casts.
 *
 * @example
 * ```ts
 * const messagesPlugin = defineClientPlugin({
 *   name: "messages",
 *   routes: () => ({
 *     messagesList: createRoute("/messages", () => ({ ... }))
 *   }),
 *   hooks: () => ({
 *     useMessages: () => { ... }
 *   })
 * });
 * // No casts needed - route keys, hook names, and types are all preserved!
 * ```
 *
 * @template TPlugin - The exact plugin definition (auto-inferred)
 */
export function defineClientPlugin<TPlugin extends ClientPlugin<any, any>>(
	plugin: TPlugin,
): TPlugin {
	return plugin;
}

/**
 * Helper to define a backend plugin with full type inference
 *
 * @example
 * ```ts
 * const messagesPlugin = defineBackendPlugin({
 *   name: "messages",
 *   dbPlugin: createDbPlugin("messages", messagesSchema),
 *   routes: (adapter) => ({
 *     list: endpoint("/messages", { method: "GET" }, async () => { ... }),
 *     create: endpoint("/messages", { method: "POST" }, async () => { ... })
 *   })
 * });
 * // Route keys "list" and "create" are preserved in types!
 * ```
 *
 * @template TRoutes - The exact shape of routes (auto-inferred from routes function)
 */
export function defineBackendPlugin<
	TRoutes extends Record<string, Endpoint> = Record<string, Endpoint>,
>(plugin: BackendPlugin<TRoutes>): BackendPlugin<TRoutes> {
	return plugin;
}
