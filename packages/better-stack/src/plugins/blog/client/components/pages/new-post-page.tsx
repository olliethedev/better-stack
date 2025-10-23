"use client";

import { useBasePath, usePluginOverrides } from "@btst/stack/context";
import { AddPostForm } from "../forms/post-forms";
import { PageHeader } from "../shared/page-header";
import { PageWrapper } from "../shared/page-wrapper";
import type { BlogPluginOverrides } from "../../overrides";
import { BLOG_LOCALIZATION } from "../../localization";

export function NewPostPageComponent() {
	const { localization } = usePluginOverrides<
		BlogPluginOverrides,
		Partial<BlogPluginOverrides>
	>("blog", {
		localization: BLOG_LOCALIZATION,
	});
	const { navigate } = usePluginOverrides<BlogPluginOverrides>("blog");
	const basePath = useBasePath();

	const handleClose = () => {
		navigate(`${basePath}/blog`);
	};

	const handleSuccess = (post: { published: boolean }) => {
		// Navigate based on published status
		if (post.published) {
			navigate(`${basePath}/blog`);
		} else {
			navigate(`${basePath}/blog/drafts`);
		}
	};

	return (
		<PageWrapper className="gap-6" testId="new-post-page">
			<PageHeader
				title={localization.BLOG_POST_ADD_TITLE}
				description={localization.BLOG_POST_ADD_DESCRIPTION}
			/>
			<AddPostForm onClose={handleClose} onSuccess={handleSuccess} />
		</PageWrapper>
	);
}
