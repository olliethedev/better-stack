import { createRouter } from "@btst/yar";
import type {
	ClientLibConfig,
	ClientLib,
	ClientPlugin,
	PluginRoutes,
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
 *     blog: blogPlugin.client
 *   }
 * });
 *
 * // SPA usage - just render the route
 * function Page() {
 *   return lib.resolveRoute('/blog');
 * }
 *
 * // SSR usage - prefetch data with loader, then render
 * async function Page({ params }) {
 *   const path = '/blog';
 *
 *   // Load data server-side if loader exists
 *   const loader = lib.getLoader(path);
 *   if (loader) await loader(queryClient, baseURL, basePath);
 *
 *   // Render with built-in Suspense + Error Boundary
 *   return lib.resolveRoute(path);
 * }
 *
 * // Next.js with notFound() function
 * import { notFound } from 'next/navigation';
 *
 * async function Page({ params }) {
 *   const path = '/blog';
 *   const loader = lib.getLoader(path);
 *   if (loader) await loader(queryClient, baseURL);
 *
 *   return lib.resolveRoute(path, {
 *     onNotFound: notFound // Calls Next.js notFound() instead of rendering
 *   });
 * }
 *
 * ```
 *
 * @template TPlugins - The exact plugins map (inferred from config)
 * @template TRoutes - All routes from all plugins, merged (computed automatically)
 */
export function createStackClient<
	TPlugins extends Record<string, ClientPlugin<any, any>>,
	TRoutes extends PluginRoutes<TPlugins> = PluginRoutes<TPlugins>,
>(config: ClientLibConfig<TPlugins>): ClientLib<TRoutes> {
	const { plugins } = config;

	// Collect all routes from all plugins
	// We build this with type assertions to preserve literal keys
	const allRoutes = {} as TRoutes;

	for (const [pluginKey, plugin] of Object.entries(plugins)) {
		// Add routes
		const pluginRoutes = plugin.routes();
		Object.assign(allRoutes, pluginRoutes);
	}

	// Create the composed router - TypeScript will infer the router type
	// The router's getRoute method will return the union of all route return types
	const router = createRouter<TRoutes, {}>(allRoutes);

	return {
		router,
	};
}

export type { ClientLib, ClientLibConfig };

export { createRoute } from "@btst/yar";
