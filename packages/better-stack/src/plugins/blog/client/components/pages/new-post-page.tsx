"use client";

import { AddPostForm } from "../forms/post-forms";
import { PageHeader } from "../shared/page-header";
import { PageWrapper } from "../shared/page-wrapper";

export function NewPostPageComponent() {
	const { localization } = {
		localization: {
			BLOG_POST_ADD_TITLE: "Add Post",
			BLOG_POST_ADD_DESCRIPTION: "Add Post Description",
		},
	};
	return (
		<PageWrapper className="gap-6" testId="new-post-page">
			<PageHeader
				title={localization.BLOG_POST_ADD_TITLE}
				description={localization.BLOG_POST_ADD_DESCRIPTION}
			/>
			<AddPostForm onClose={() => {}} onSuccess={() => {}} />
		</PageWrapper>
	);
}
