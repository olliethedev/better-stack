"use client";

import { PageHeader } from "../shared/page-header";
import { PageWrapper } from "../shared/page-wrapper";
import { PostsList } from "../shared/posts-list";

import { useSuspensePosts } from "../../hooks/blog-hooks";
import { Suspense } from "react";

export function HomePageComponent() {
	const { localization } = {
		localization: {
			BLOG_LIST_TITLE: "Blog List",
			BLOG_LIST_DESCRIPTION: "Blog List Description",
		},
	};

	return (
		<PageWrapper testId="home-page">
			<div className="flex flex-col items-center gap-3">
				<PageHeader
					title={localization.BLOG_LIST_TITLE}
					description={localization.BLOG_LIST_DESCRIPTION}
				/>
			</div>
			<Suspense fallback={<div>Loading...</div>}>
				<Content />
			</Suspense>
		</PageWrapper>
	);
}

function Content() {
	const { posts, loadMore, hasMore, isLoadingMore } = useSuspensePosts({
		published: true,
	});
	console.log("[HomePageComponent] posts", posts);
	return (
		<PostsList
			posts={posts}
			onLoadMore={loadMore}
			hasMore={hasMore}
			isLoadingMore={isLoadingMore}
		/>
	);
}
