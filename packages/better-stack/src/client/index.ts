import { createRouter } from "@btst/yar";
import type {
	ClientLibConfig,
	ClientLib,
	ClientPlugin,
	PluginRoutes,
	PluginHooks,
} from "../types";
export type { ClientPlugin } from "../types";

/**
 * Creates the client library with plugin support
 *
 * @example
 * ```ts
 * // For Next.js with SSR:
 * const lib = createStackClient({
 *   plugins: {
 *     messages: messagesPlugin.client
 *   }
 * });
 *
 * // Access router for page routing
 * const route = lib.router.getRoute('/messages');
 *
 * // For SPA (just use hooks directly):
 * const { useMessages } = lib.hooks.messages;
 * ```
 *
 * @template TPlugins - The exact plugins map (inferred from config)
 * @template TRoutes - All routes from all plugins, merged (computed automatically)
 * @template THooks - All hooks from all plugins, organized by plugin name (computed automatically)
 */
export function createStackClient<
	TPlugins extends Record<string, ClientPlugin<any, any>>,
	TRoutes extends PluginRoutes<TPlugins> = PluginRoutes<TPlugins>,
	THooks extends PluginHooks<TPlugins> = PluginHooks<TPlugins>,
>(config: ClientLibConfig<TPlugins>): ClientLib<TRoutes, THooks> {
	const { plugins } = config;

	// Collect all routes from all plugins
	// We build this with type assertions to preserve literal keys
	const allRoutes = {} as TRoutes;

	// Collect all hooks from all plugins
	const allHooks = {} as THooks;

	for (const [pluginKey, plugin] of Object.entries(plugins)) {
		// Add routes
		const pluginRoutes = plugin.routes();
		Object.assign(allRoutes, pluginRoutes);

		// Add hooks if they exist
		if (plugin.hooks) {
			(allHooks as any)[pluginKey] = plugin.hooks();
		}
	}

	// Create the composed router - TypeScript will infer the router type
	// The router's getRoute method will return the union of all route return types
	const router = createRouter<TRoutes, {}>(allRoutes);

	return {
		router,
		hooks: allHooks,
	};
}

export type { ClientLib, ClientLibConfig };

// Export context system
export {
	BetterStackProvider,
	useBetterStack,
	usePluginOverrides,
	usePluginOverride,
} from "../context";

export { createApiClient, getServerBaseURL } from "../plugins/utils";
