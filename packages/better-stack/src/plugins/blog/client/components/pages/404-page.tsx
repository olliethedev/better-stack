"use client";

import { usePluginOverrides } from "@btst/stack/context";
import { ErrorPlaceholder } from "../shared/error-placeholder";
import { BLOG_LOCALIZATION } from "../../localization";
import type { BlogPluginOverrides } from "../../overrides";

export function NotFoundPage({ message }: { message: string }) {
	const { localization } = usePluginOverrides<
		BlogPluginOverrides,
		Partial<BlogPluginOverrides>
	>("blog", {
		localization: BLOG_LOCALIZATION,
	});
	const title = localization.BLOG_PAGE_NOT_FOUND_TITLE;
	const desc = message || localization.BLOG_PAGE_NOT_FOUND_DESCRIPTION;
	return <ErrorPlaceholder title={title} message={desc} />;
}
