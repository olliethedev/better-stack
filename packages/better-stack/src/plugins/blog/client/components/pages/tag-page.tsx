"use client";

import { PageHeader } from "../shared/page-header";
import { PageWrapper } from "../shared/page-wrapper";
import { PostsList } from "../shared/posts-list";
import { EmptyList } from "../shared/empty-list";

import { useSuspensePosts } from "../../hooks/blog-hooks";
import { BLOG_LOCALIZATION } from "../../localization";
import { usePluginOverrides } from "@btst/stack/context";
import type { BlogPluginOverrides } from "../../overrides";
import { useTags } from "../../hooks/blog-hooks";
import { ComposedRoute } from "@btst/stack/client/components";
import { DefaultError } from "../shared/default-error";
import { PostsLoading } from "../loading";
import { NotFoundPage } from "./404-page";
import { useRouteLifecycle } from "../shared/use-route-lifecycle";

// Internal component with actual page content
function TagPage({ tagSlug }: { tagSlug: string }) {
	const { localization } = usePluginOverrides<
		BlogPluginOverrides,
		Partial<BlogPluginOverrides>
	>("blog", {
		localization: BLOG_LOCALIZATION,
	});

	// Call lifecycle hooks
	useRouteLifecycle({
		routeName: "tag",
		context: {
			path: `/blog/tag/${tagSlug}`,
			params: { tagSlug },
			isSSR: typeof window === "undefined",
		},
	});

	const { tags } = useTags();
	const tag = tags?.find((t) => t.slug === tagSlug);

	if (!tag) {
		return (
			<PageWrapper testId="tag-page">
				<div className="flex flex-col items-center gap-3">
					<PageHeader
						title={localization.BLOG_TAG_NOT_FOUND}
						description={localization.BLOG_TAG_NOT_FOUND_DESCRIPTION}
					/>
				</div>
				<EmptyList message={localization.BLOG_TAG_NOT_FOUND_DESCRIPTION} />
			</PageWrapper>
		);
	}

	return (
		<PageWrapper testId="tag-page">
			<div className="flex flex-col items-center gap-3">
				<PageHeader
					title={`${localization.BLOG_TAG_PAGE_TITLE} ${tag.name}`}
					description={localization.BLOG_TAG_PAGE_DESCRIPTION}
				/>
			</div>
			<Content tagSlug={tagSlug} />
		</PageWrapper>
	);
}

function Content({ tagSlug }: { tagSlug: string }) {
	const { posts, loadMore, hasMore, isLoadingMore } = useSuspensePosts({
		published: true,
		tagSlug: tagSlug,
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

// Exported wrapped component with error and loading boundaries
export function TagPageComponent({ tagSlug }: { tagSlug: string }) {
	const { onRouteError } = usePluginOverrides<BlogPluginOverrides>("blog");
	return (
		<ComposedRoute
			path={`/blog/tag/${tagSlug}`}
			PageComponent={TagPage}
			ErrorComponent={DefaultError}
			LoadingComponent={PostsLoading}
			NotFoundComponent={NotFoundPage}
			props={{ tagSlug }}
			onError={(error) => {
				if (onRouteError) {
					onRouteError("tag", error, {
						path: `/blog/tag/${tagSlug}`,
						isSSR: typeof window === "undefined",
						tagSlug,
					});
				}
			}}
		/>
	);
}
