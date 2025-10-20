"use client";

import type { FallbackProps } from "react-error-boundary";
import { ErrorPlaceholder } from "./error-placeholder";

// Default error component for blog plugin routes
export function DefaultError({ error }: FallbackProps) {
	const { localization } = {
		localization: {
			BLOG_LIST_ERROR_TITLE: "Error",
			BLOG_LIST_ERROR: "An error occurred while loading the page",
		},
	};
	const title = localization.BLOG_LIST_ERROR_TITLE;
	const message = error?.message ?? localization.BLOG_LIST_ERROR;
	return <ErrorPlaceholder title={title} message={message} />;
}
