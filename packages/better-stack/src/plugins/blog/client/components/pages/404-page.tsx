"use client";

import { ErrorPlaceholder } from "../shared/error-placeholder";

// Not Found route placeholder using localized strings
export function NotFoundPage({ message }: { message: string }) {
	const { localization } = {
		localization: {
			BLOG_PAGE_NOT_FOUND_TITLE: "Page Not Found",
			BLOG_PAGE_NOT_FOUND_DESCRIPTION:
				"The page you are looking for does not exist.",
		},
	};
	const title = localization.BLOG_PAGE_NOT_FOUND_TITLE;
	const desc = message || localization.BLOG_PAGE_NOT_FOUND_DESCRIPTION;
	return <ErrorPlaceholder title={title} message={desc} />;
}
