import { defineClientPlugin, createApiClient } from "@btst/stack/plugins";
import { createRoute } from "@btst/yar";
import type { QueryClient } from "@tanstack/react-query";
import type { BlogApiRouter } from "../api/plugin";
import { HomePageComponent } from "./components/pages/home-page";
import { NewPostPageComponent } from "./components/pages/new-post-page";

// Loader for SSR prefetching
async function postsLoader(
	queryClient: QueryClient,
	baseURL: string,
	basePath: string = "/api",
) {
	if (typeof window === "undefined") {
		const limit = 10;
		// Construct query key exactly as useSuspensePosts does
		const queryKey = [
			"blog",
			"posts",
			{
				slug: undefined,
				query: undefined,
				published: true,
				limit,
			},
		] as const;

		console.log("[SSR] Prefetching with queryKey:", JSON.stringify(queryKey));

		await queryClient.prefetchInfiniteQuery({
			queryKey,
			queryFn: async () => {
				try {
					const client = createApiClient<BlogApiRouter>({
						baseURL: baseURL,
						basePath: basePath,
					});
					const response = await client("/posts", {
						method: "GET",
						query: {
							offset: 0,
							limit,
							published: true,
						},
					});
					console.log(
						"[SSR] Prefetched blog posts:",
						response.data?.length ?? 0,
						"posts",
					);
					return response.data ?? [];
				} catch (error) {
					console.error("[SSR] Error prefetching blog posts:", error);
					// Return empty array so the query still has initial data
					// This allows the page to render and the client-side query will retry
					return [];
				}
			},
			initialPageParam: 0,
		});
	}
}

// // Lazy-load the component to avoid SSR issues
// let PostListPageComponent: ComponentType<unknown> | null = null;
// function getPostListPage() {
//   if (!PostListPageComponent) {
//     // Use require to avoid bundler issues
//     PostListPageComponent = require("./components").PostListPage;
//   }
//   return PostListPageComponent;
// }

// // lazy-load the new post page component
// let NewPostPageComponent: ComponentType<unknown> | null = null;
// function getNewPostPage() {
//   if (!NewPostPageComponent) {
//     // Use require to avoid bundler issues
//     NewPostPageComponent = require("./components").NewPostPage;
//   }
//   return NewPostPageComponent;
// }

/**
 * Blog client plugin
 * Provides routes, components, and React Query hooks for blog posts
 */
export const blogClientPlugin = defineClientPlugin({
	name: "blog",

	routes: () => ({
		posts: createRoute("/", () => ({
			PageComponent: HomePageComponent,
			loader: postsLoader,
			meta: (config: { url: string }) => [
				{ name: "title", content: `Blog Posts` },
				{
					name: "description",
					content: `Read our latest blog posts.`,
				},
			],
		})),
		newPost: createRoute("/new", () => ({
			PageComponent: NewPostPageComponent,
			meta: (config: { url: string }) => [
				{ name: "title", content: `New Post` },
				{
					name: "description",
					content: `Create a new blog post.`,
				},
			],
		})),
	}),
});
