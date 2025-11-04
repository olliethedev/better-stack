"use client";
import {
	ErrorBoundary as ReactErrorBoundary,
	type FallbackProps,
} from "react-error-boundary";

export type { FallbackProps } from "react-error-boundary";

export function ErrorBoundary({
	children,
	FallbackComponent,
	resetKeys,
}: {
	children: React.ReactNode;
	FallbackComponent: React.ComponentType<FallbackProps>;
	resetKeys?: Array<string | number | boolean | null | undefined>;
}) {
	return (
		<ReactErrorBoundary
			FallbackComponent={FallbackComponent}
			resetKeys={resetKeys}
		>
			{children}
		</ReactErrorBoundary>
	);
}
