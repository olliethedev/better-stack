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
 * Helper type to extract plugin structure without leaking internal type references
 * This ensures types are portable across package boundaries
 */
type PortableClientPlugin<TPlugin extends ClientPlugin<any, any>> = ClientPlugin<
	TPlugin extends ClientPlugin<infer TOverrides, any> ? TOverrides : never,
	TPlugin extends ClientPlugin<any, infer TRoutes> ? TRoutes : never
>;

/**
 * Helper to define a client plugin with full type inference
 *
 * Automatically infers route keys, hook names, and their types without needing casts.
 * Returns a portable type that doesn't leak internal pnpm path references.
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
): PortableClientPlugin<TPlugin> {
	return plugin as PortableClientPlugin<TPlugin>;
}
