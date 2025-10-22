import { defineClientPlugin, createApiClient } from "@btst/stack/plugins";
import { createRoute } from "@btst/yar";
import type { QueryClient } from "@tanstack/react-query";
import type { BlogApiRouter } from "../api/plugin";
import { HomePageComponent } from "./components/pages/home-page";
import { NewPostPageComponent } from "./components/pages/new-post-page";
import { PostsLoading, FormLoading } from "./components/loading";
import { DefaultError } from "./components/shared/default-error";
import { createBlogQueryKeys } from "../query-keys";
import { EditPostPageComponent } from "./components/pages/edit-post-page";
import { PostPageComponent } from "./components/pages/post-page";

// Loader for SSR prefetching
async function postsLoader(
	queryClient: QueryClient,
	baseURL: string,
	basePath: string = "/api",
) {
	if (typeof window === "undefined") {
		const limit = 10;

		const client = createApiClient<BlogApiRouter>({
			baseURL: baseURL,
			basePath: basePath,
		});

		// note: for a module not to be bundled with client, and to be shared by client and server we need to add it to build.config.ts as an entry
		const queries = createBlogQueryKeys(client);
		const listQuery = queries.posts.list({
			query: undefined,
			limit,
			published: true,
		});

		await queryClient.prefetchInfiniteQuery({
			...listQuery,
			initialPageParam: 0,
		});
	}
}

function createPostLoader(slug: string) {
	return async (
		queryClient: QueryClient,
		baseURL: string,
		basePath: string = "/api",
	) => {
		if (typeof window === "undefined") {
			const client = createApiClient<BlogApiRouter>({
				baseURL: baseURL,
				basePath: basePath,
			});
			const queries = createBlogQueryKeys(client);
			const postQuery = queries.posts.detail(slug);
			await queryClient.prefetchQuery(postQuery);
		}
	};
}

/**
 * Blog client plugin
 * Provides routes, components, and React Query hooks for blog posts
 */
export const blogClientPlugin = defineClientPlugin({
	name: "blog",

	routes: () => ({
		posts: createRoute("/blog", () => ({
			PageComponent: HomePageComponent,
			ErrorComponent: DefaultError,
			LoadingComponent: PostsLoading,
			loader: postsLoader,
			meta: (config: { url: string }) => [
				{ name: "title", content: `Blog Posts` },
				{
					name: "description",
					content: `Read our latest blog posts.`,
				},
			],
		})),
		newPost: createRoute("/blog/new", () => ({
			PageComponent: NewPostPageComponent,
			ErrorComponent: DefaultError,
			LoadingComponent: FormLoading,
			meta: (config: { url: string }) => [
				{ name: "title", content: `New Post` },
				{
					name: "description",
					content: `Create a new blog post.`,
				},
			],
		})),
		editPost: createRoute("/blog/:slug/edit", ({ params: { slug } }) => ({
			PageComponent: () => <EditPostPageComponent slug={slug} />,
			loader: createPostLoader(slug),
			ErrorComponent: DefaultError,
			LoadingComponent: FormLoading,
			meta: (config: { url: string }) => [
				{ name: "title", content: `Edit Post` },
			],
		})),
		post: createRoute("/blog/:slug", ({ params: { slug } }) => ({
			PageComponent: () => <PostPageComponent slug={slug} />,
			loader: createPostLoader(slug),
			ErrorComponent: DefaultError,
			LoadingComponent: FormLoading,
			meta: (config: { url: string }) => [{ name: "title", content: `Post` }],
		})),
	}),
});
