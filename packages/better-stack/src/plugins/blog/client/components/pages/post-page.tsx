"use client";

import { usePluginOverrides } from "@btst/stack/context";
import { formatDate } from "date-fns";
import { useSuspensePost } from "../../hooks/blog-hooks";
import { EmptyList } from "../shared/empty-list";
import { MarkdownContent } from "../shared/markdown-content";
import { PageHeader } from "../shared/page-header";
import { PageWrapper } from "../shared/page-wrapper";
import type { BlogPluginOverrides } from "../../overrides";
import { DefaultImage, DefaultLink } from "../shared/defaults";
import { BLOG_LOCALIZATION } from "../../localization";

export function PostPageComponent({ slug }: { slug: string }) {
	const { Image, localization } = usePluginOverrides<
		BlogPluginOverrides,
		Partial<BlogPluginOverrides>
	>("blog", {
		Link: DefaultLink,
		Image: DefaultImage,
		localization: BLOG_LOCALIZATION,
	});

	// Call hook unconditionally to comply with Rules of Hooks
	const { post } = useSuspensePost(slug ?? "");

	// Check for missing slug or post after hook call
	if (!slug || !post) {
		return <EmptyList message={localization.BLOG_PAGE_NOT_FOUND_DESCRIPTION} />;
	}

	return (
		<PageWrapper className="gap-6" testId="post-page">
			<PageHeader title={post.title} description={post.excerpt} />

			<div className="flex flex-col gap-2">
				<div className="flex flex-row gap-2">
					<span className="font-light text-muted-foreground text-sm">
						{formatDate(post.createdAt, "MMMM d, yyyy")}
					</span>
				</div>

				{post.image && (
					<Image
						src={post.image}
						alt={post.title}
						className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
						width={1000}
						height={600}
					/>
				)}
			</div>

			<MarkdownContent markdown={post.content} />
		</PageWrapper>
	);
}
