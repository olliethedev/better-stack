"use client";

import { useBasePath, usePluginOverrides } from "@btst/stack/context";
import { EditPostForm } from "../forms/post-forms";
import { PageHeader } from "../shared/page-header";
import { PageWrapper } from "../shared/page-wrapper";
import { BLOG_LOCALIZATION } from "../../localization";
import type { BlogPluginOverrides } from "../../overrides";

export function EditPostPageComponent({ slug }: { slug: string }) {
	const { localization } = usePluginOverrides<
		BlogPluginOverrides,
		Partial<BlogPluginOverrides>
	>("blog", {
		localization: BLOG_LOCALIZATION,
	});
	const basePath = useBasePath();
	const { navigate } = usePluginOverrides<BlogPluginOverrides>("blog");

	const handleClose = () => {
		navigate(`${basePath}/blog`);
	};

	const handleSuccess = (post: { slug: string; published: boolean }) => {
		// Navigate based on published status
		navigate(`${basePath}/blog/${post.slug}`);
	};

	return (
		<PageWrapper className="gap-6" testId="edit-post-page">
			<PageHeader
				title={localization.BLOG_POST_EDIT_TITLE}
				description={localization.BLOG_POST_EDIT_DESCRIPTION}
			/>
			<EditPostForm
				postSlug={slug}
				onClose={handleClose}
				onSuccess={handleSuccess}
			/>
		</PageWrapper>
	);
}
