import { createRouter } from "better-call";
import type {
	BackendLibConfig,
	BackendLib,
	PrefixedPluginRoutes,
} from "../types";
import { defineDb } from "@better-db/core";

/**
 * Creates the backend library with plugin support
 *
 * @example
 * ```ts
 * const api = betterStack({
 *   plugins: {
 *     messages: messagesPlugin.backend
 *   },
 *   adapter: memoryAdapter
 * });
 *
 * // Use in API route:
 * export const GET = api.handler;
 * export const POST = api.handler;
 * ```
 *
 * @template TPlugins - The exact plugins map (inferred from config)
 * @template TRoutes - All routes with prefixed keys like "pluginName_routeName" (computed automatically)
 */
export function betterStack<
	TPlugins extends Record<string, any>,
	TRoutes extends
		PrefixedPluginRoutes<TPlugins> = PrefixedPluginRoutes<TPlugins>,
>(config: BackendLibConfig<TPlugins>): BackendLib<TRoutes> {
	const { plugins, adapter, dbSchema } = config;

	// Collect all routes from all plugins with type-safe prefixed keys
	const allRoutes = {} as TRoutes;

	let betterDbSchema = dbSchema ?? defineDb({});

	// use all the db plugins on the betterDbSchema
	for (const [pluginKey, plugin] of Object.entries(plugins)) {
		betterDbSchema = betterDbSchema.use(plugin.dbPlugin);
	}

	for (const [pluginKey, plugin] of Object.entries(plugins)) {
		// Pass the adapter directly to plugin routes
		const pluginRoutes = plugin.routes(adapter(betterDbSchema));

		// Prefix route keys with plugin name to avoid collisions
		for (const [routeKey, endpoint] of Object.entries(pluginRoutes)) {
			const compositeKey = `${pluginKey}_${routeKey}` as keyof TRoutes;
			(allRoutes as any)[compositeKey] = endpoint;
		}
	}

	// Create the composed router
	const router = createRouter(allRoutes, {
		basePath: "/api",
	});

	return {
		handler: router.handler,
		router,
		dbSchema: betterDbSchema,
	};
}

export type {
	BackendPlugin,
	BackendLibConfig,
	BackendLib,
} from "../types";
