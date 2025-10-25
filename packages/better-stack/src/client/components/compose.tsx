"use client";

import React, { Suspense } from "react";
import { type FallbackProps } from "react-error-boundary";
import type { createRouter } from "@btst/yar";
import { ErrorBoundary } from "./error-boundary";

/**
 * Route type with optional components
 */
export type RouteWithComponents =
	| {
			PageComponent?: React.ComponentType;
			ErrorComponent?: React.ComponentType<FallbackProps>;
			LoadingComponent?: React.ComponentType;
	  }
	| null
	| undefined;

/**
 * Composes the route content with Suspense and Error Boundary
 * Resolves the route on the client-side where component references are available
 *
 * This is marked "use client" so it can access component references safely
 */
export function RouteRenderer({
	router,
	path,
	NotFoundComponent,
	onNotFound,
}: {
	router: ReturnType<typeof createRouter>;
	path: string;
	NotFoundComponent?: React.ComponentType<{ message: string }>;
	/**
	 * Function to call when route is not found (e.g., Next.js notFound())
	 * If provided, this will be called instead of rendering NotFoundComponent
	 */
	onNotFound?: () => never;
}) {
	// Resolve route on the client where components are available
	const route = router.getRoute(path);

	if (route) {
		// Get components from the route
		const PageComponent = route.PageComponent;
		const ErrorComponent = route.ErrorComponent;
		const LoadingComponent = route.LoadingComponent;

		if (PageComponent) {
			const content = <PageComponent />;
			// Avoid server-side skeletons: only show loading fallback in the browser
			const isBrowser = typeof window !== "undefined";
			const suspenseFallback =
				isBrowser && LoadingComponent ? <LoadingComponent /> : null;
			const suspenseWrapped = (
				<Suspense fallback={suspenseFallback}>{content}</Suspense>
			);

			// Only wrap with ErrorBoundary if a FallbackComponent was provided by the route
			if (ErrorComponent) {
				return (
					<ErrorBoundary FallbackComponent={ErrorComponent}>
						{suspenseWrapped}
					</ErrorBoundary>
				);
			}

			return suspenseWrapped;
		}
	}

	// Fallback for unknown routes
	// If onNotFound function is provided (e.g., Next.js notFound()), call it
	if (onNotFound) {
		onNotFound();
	}

	// Otherwise render the NotFoundComponent if provided
	if (NotFoundComponent) {
		return <NotFoundComponent message={`Unknown route: ${path}`} />;
	}

	// Ultimate fallback
	return null;
}
