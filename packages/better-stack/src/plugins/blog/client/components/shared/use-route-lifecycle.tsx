"use client";

import { useEffect } from "react";
import { usePluginOverrides } from "@btst/stack/context";
import type { BlogPluginOverrides, RouteContext } from "../../overrides";

/**
 * Hook to handle route lifecycle events
 * - Calls authorization check before render
 * - Calls onRouteRender on mount
 * - Handles errors with onRouteError
 */
export function useRouteLifecycle({
	routeName,
	context,
	beforeRenderHook,
}: {
	routeName: string;
	context: RouteContext;
	beforeRenderHook?: (
		overrides: BlogPluginOverrides,
		context: RouteContext,
	) => boolean;
}) {
	const overrides = usePluginOverrides<BlogPluginOverrides>("blog");

	// Authorization check - runs synchronously before render
	if (beforeRenderHook) {
		const canRender = beforeRenderHook(overrides, context);
		if (!canRender) {
			const error = new Error(`Unauthorized: Cannot render ${routeName}`);
			// Call error hook synchronously
			if (overrides.onRouteError) {
				try {
					const result = overrides.onRouteError(routeName, error, context);
					if (result instanceof Promise) {
						result.catch(() => {}); // Ignore promise rejection
					}
				} catch {
					// Ignore errors in error hook
				}
			}
			throw error;
		}
	}

	// Lifecycle hook - runs on mount
	useEffect(() => {
		if (overrides.onRouteRender) {
			try {
				const result = overrides.onRouteRender(routeName, context);
				if (result instanceof Promise) {
					result.catch((error) => {
						// If onRouteRender throws, call onRouteError
						if (overrides.onRouteError) {
							overrides.onRouteError(routeName, error, context);
						}
					});
				}
			} catch (error) {
				// If onRouteRender throws, call onRouteError
				if (overrides.onRouteError) {
					overrides.onRouteError(routeName, error as Error, context);
				}
			}
		}
	}, [routeName, overrides, context]);
}
