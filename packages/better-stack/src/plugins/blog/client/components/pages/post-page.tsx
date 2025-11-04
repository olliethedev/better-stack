"use client";

import { usePluginOverrides, useBasePath } from "@btst/stack/context";
import { formatDate } from "date-fns";
import { useSuspensePost, useNextPreviousPosts } from "../../hooks/blog-hooks";
import { EmptyList } from "../shared/empty-list";
import { MarkdownContent } from "../shared/markdown-content";
import { PageHeader } from "../shared/page-header";
import { PageWrapper } from "../shared/page-wrapper";
import type { BlogPluginOverrides } from "../../overrides";
import { DefaultImage, DefaultLink } from "../shared/defaults";
import { BLOG_LOCALIZATION } from "../../localization";
import { PostNavigation } from "../shared/post-navigation";
import { Badge } from "@workspace/ui/components/badge";

export function PostPageComponent({ slug }: { slug: string }) {
	const { Image, Link, localization } = usePluginOverrides<
		BlogPluginOverrides,
		Partial<BlogPluginOverrides>
	>("blog", {
		Image: DefaultImage,
		Link: DefaultLink,
		localization: BLOG_LOCALIZATION,
	});
	const basePath = useBasePath();

	const { post } = useSuspensePost(slug ?? "");

	const { previousPost, nextPost, ref } = useNextPreviousPosts(
		post?.createdAt ?? new Date(),
		{
			enabled: !!post,
		},
	);

	if (!slug || !post) {
		return <EmptyList message={localization.BLOG_PAGE_NOT_FOUND_DESCRIPTION} />;
	}

	return (
		<PageWrapper className="gap-6" testId="post-page">
			<PageHeader title={post.title} description={post.excerpt} />

			<div className="flex flex-col gap-2">
				<div className="flex flex-row items-center gap-2 flex-wrap">
					<span className="font-light text-muted-foreground text-sm">
						{formatDate(post.createdAt, "MMMM d, yyyy")}
					</span>
					{post.tags && post.tags.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{post.tags.map((tag) => (
								<Link key={tag.id} href={`${basePath}/blog/tag/${tag.slug}`}>
									<Badge variant="secondary" className="text-xs">
										{tag.name}
									</Badge>
								</Link>
							))}
						</div>
					)}
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

			<PostNavigation
				previousPost={previousPost}
				nextPost={nextPost}
				ref={ref}
			/>
		</PageWrapper>
	);
}
