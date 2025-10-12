import { createRouter } from "@olliethedev/yar";
import type { ClientLibConfig, ClientLib } from "../types";
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
export function createStackClient<TPlugins extends Record<string, any>>(
	config: ClientLibConfig<TPlugins>,
): ClientLib {
	const { plugins, baseURL, basePath } = config;

	// Collect all routes from all plugins
	const allRoutes: Record<string, any> = {};

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

	// Create the composed router
	const router = createRouter(allRoutes);

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
