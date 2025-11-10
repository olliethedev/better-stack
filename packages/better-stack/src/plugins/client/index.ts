/**
 * Plugin utilities and types for building standalone plugins
 *
 * This module exports everything needed to create custom plugins
 * for Better Stack outside of this package.
 *
 * Note: Backend and Client plugins are separate to prevent SSR issues
 * and enable better code splitting. Import them separately:
 * - Backend: import type { BackendPlugin } from "@btst/stack/plugins/api"
 * - Client: import type { ClientPlugin } from "@btst/stack/plugins/client"
 */

import type { ClientPlugin } from "../../types";

export type {
	ClientPlugin,
	PluginOverrides,
} from "../../types";

export { createApiClient } from "../utils";

// Re-export Yar types needed for plugins
export type { Route } from "@btst/yar";
export { createRoute, createRouter } from "@btst/yar";

export { createClient } from "better-call/client";

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
