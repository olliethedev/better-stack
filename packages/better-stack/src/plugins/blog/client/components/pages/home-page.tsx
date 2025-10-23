"use client";

import { PageHeader } from "../shared/page-header";
import { PageWrapper } from "../shared/page-wrapper";
import { PostsList } from "../shared/posts-list";

import { useSuspensePosts } from "../../hooks/blog-hooks";
import { BLOG_LOCALIZATION } from "../../localization";
import { usePluginOverrides } from "@btst/stack/context";
import type { BlogPluginOverrides } from "../../overrides";

export function HomePageComponent({
	published = true,
}: {
	published?: boolean;
}) {
	const { localization } = usePluginOverrides<
		BlogPluginOverrides,
		Partial<BlogPluginOverrides>
	>("blog", {
		localization: BLOG_LOCALIZATION,
	});

	return (
		<PageWrapper testId="home-page">
			<div className="flex flex-col items-center gap-3">
				<PageHeader
					title={localization.BLOG_LIST_TITLE}
					description={localization.BLOG_LIST_DESCRIPTION}
				/>
			</div>
			<Content published={published} />
		</PageWrapper>
	);
}

function Content({ published }: { published: boolean }) {
	const { posts, loadMore, hasMore, isLoadingMore } = useSuspensePosts({
		published: published,
	});
	return (
		<PostsList
			posts={posts}
			onLoadMore={loadMore}
			hasMore={hasMore}
			isLoadingMore={isLoadingMore}
		/>
	);
}
