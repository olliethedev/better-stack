"use client";
import {
	ErrorBoundary as ReactErrorBoundary,
	type FallbackProps,
} from "react-error-boundary";

export function ErrorBoundary({
	children,
	FallbackComponent,
}: {
	children: React.ReactNode;
	FallbackComponent: React.ComponentType<FallbackProps>;
}) {
	return (
		<ReactErrorBoundary FallbackComponent={FallbackComponent}>
			{children}
		</ReactErrorBoundary>
	);
}
