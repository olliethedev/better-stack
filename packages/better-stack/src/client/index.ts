import { createRouter } from "@olliethedev/yar";
import type { ClientLibConfig, ClientLib, ClientPlugin, MergeAllPluginRoutes } from "../types";
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
 */
export function createStackClient<
	TPlugins extends Record<string, ClientPlugin>,
>(config: ClientLibConfig<TPlugins>): ClientLib<MergeAllPluginRoutes<TPlugins> & Record<string, any>> {
	const { plugins, baseURL, basePath } = config;

	// Collect all routes from all plugins
	const allRoutes: any = {};
	
	// Collect all hooks from all plugins
	const allHooks: Record<string, Record<string, any>> = {};

	for (const [pluginKey, plugin] of Object.entries(plugins)) {
		// Add routes
		const pluginRoutes = plugin.routes();
		Object.assign(allRoutes, pluginRoutes);

		// Add hooks if they exist
		if (plugin.hooks) {
			allHooks[pluginKey] = plugin.hooks();
		}
	}

	// Create the composed router - TypeScript will infer the router type
	// The router's getRoute method will return the union of all route return types
	const router = createRouter(allRoutes);

	return {
		router,
		hooks: allHooks,
	} as any;
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
