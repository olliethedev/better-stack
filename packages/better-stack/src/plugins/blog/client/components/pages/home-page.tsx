"use client";

import { PageHeader } from "../shared/page-header";
import { PageWrapper } from "../shared/page-wrapper";
import { PostsList } from "../shared/posts-list";

import { useSuspensePosts } from "../../hooks/blog-hooks";
import { BLOG_LOCALIZATION } from "../../localization";
import { usePluginOverrides } from "@btst/stack/context";
import type { BlogPluginOverrides } from "../../overrides";
import { ComposedRoute } from "@btst/stack/client/components";
import { DefaultError } from "../shared/default-error";
import { PostsLoading } from "../loading";
import { NotFoundPage } from "./404-page";
import { useRouteLifecycle } from "../shared/use-route-lifecycle";

// Internal component with actual page content
function HomePage({ published }: { published: boolean }) {
	const { localization } = usePluginOverrides<
		BlogPluginOverrides,
		Partial<BlogPluginOverrides>
	>("blog", {
		localization: BLOG_LOCALIZATION,
	});

	// Call lifecycle hooks
	useRouteLifecycle({
		routeName: published ? "posts" : "drafts",
		context: {
			path: published ? "/blog" : "/blog/drafts",
			isSSR: typeof window === "undefined",
			published,
		},
		beforeRenderHook: (overrides, context) => {
			if (published && overrides.onBeforePostsPageRendered) {
				return overrides.onBeforePostsPageRendered(context);
			}
			if (!published && overrides.onBeforeDraftsPageRendered) {
				return overrides.onBeforeDraftsPageRendered(context);
			}
			return true;
		},
	});

	return (
		<PageWrapper testId={published ? "home-page" : "drafts-home-page"}>
			<div className="flex flex-col items-center gap-3">
				<PageHeader
					title={
						published
							? localization.BLOG_LIST_TITLE
							: localization.BLOG_LIST_DRAFTS_TITLE
					}
					description={
						published
							? localization.BLOG_LIST_DESCRIPTION
							: localization.BLOG_LIST_DRAFTS_DESCRIPTION
					}
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

// Exported wrapped component with error and loading boundaries
export function HomePageComponent({
	published = true,
}: {
	published?: boolean;
}) {
	const { onRouteError } = usePluginOverrides<BlogPluginOverrides>("blog");
	return (
		<ComposedRoute
			path={published ? "/blog" : "/blog/drafts"}
			PageComponent={HomePage}
			ErrorComponent={DefaultError}
			LoadingComponent={PostsLoading}
			NotFoundComponent={NotFoundPage}
			props={{ published }}
			onError={(error) => {
				if (onRouteError) {
					onRouteError("posts", error, {
						path: published ? "/blog" : "/blog/drafts",
						isSSR: typeof window === "undefined",
						published,
					});
				}
			}}
		/>
	);
}
