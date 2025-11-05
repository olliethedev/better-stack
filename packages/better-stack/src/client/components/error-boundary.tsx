"use client";
import type { ErrorInfo } from "react";
import {
	ErrorBoundary as ReactErrorBoundary,
	type FallbackProps,
} from "react-error-boundary";

export type { FallbackProps } from "react-error-boundary";

export function ErrorBoundary({
	children,
	FallbackComponent,
	resetKeys,
	onError,
}: {
	children: React.ReactNode;
	FallbackComponent: React.ComponentType<FallbackProps>;
	resetKeys?: Array<string | number | boolean | null | undefined>;
	onError: (error: Error, info: ErrorInfo) => void;
}) {
	return (
		<ReactErrorBoundary
			FallbackComponent={FallbackComponent}
			onError={onError}
			resetKeys={resetKeys}
		>
			{children}
		</ReactErrorBoundary>
	);
}
