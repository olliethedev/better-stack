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
import type { Post } from "../types";

/**
 * Context passed to route hooks
 */
export interface RouteContext {
	path: string;
	params?: Record<string, string>;
	isSSR?: boolean;
	[key: string]: any;
}

/**
 * Context passed to loader hooks
 */
export interface LoaderContext {
	path: string;
	params?: Record<string, string>;
	isSSR: boolean;
	baseURL: string;
	basePath: string;
	[key: string]: any;
}

/**
 * Configuration for blog client plugin
 * Includes both hooks and required config (queryClient, baseURL, etc.)
 */
export interface BlogClientConfig {
	// Required configuration
	queryClient: QueryClient;
	baseURL: string;
	basePath?: string;

	// Optional context to pass to loaders (for SSR)
	context?: Record<string, any>;

	// Optional hooks
	hooks?: BlogClientHooks;
}

/**
 * Hooks for blog client plugin
 * All hooks are optional and allow consumers to customize behavior
 */
export interface BlogClientHooks {
	// Route Authorization Hooks - called before rendering a route
	canViewPosts?: (context: RouteContext) => Promise<boolean> | boolean;
	canViewDrafts?: (context: RouteContext) => Promise<boolean> | boolean;
	canCreatePost?: (context: RouteContext) => Promise<boolean> | boolean;
	canEditPost?: (
		slug: string,
		context: RouteContext,
	) => Promise<boolean> | boolean;
	canViewPost?: (
		slug: string,
		context: RouteContext,
	) => Promise<boolean> | boolean;

	// Loader Hooks - called during data loading (SSR or CSR)
	beforeLoadPosts?: (
		filter: { published: boolean },
		context: LoaderContext,
	) => Promise<boolean> | boolean;
	afterLoadPosts?: (
		posts: Post[] | null,
		filter: { published: boolean },
		context: LoaderContext,
	) => Promise<void> | void;
	beforeLoadPost?: (
		slug: string,
		context: LoaderContext,
	) => Promise<boolean> | boolean;
	afterLoadPost?: (
		post: Post | null,
		slug: string,
		context: LoaderContext,
	) => Promise<void> | void;
	onLoadError?: (error: Error, context: LoaderContext) => Promise<void> | void;

	// Navigation Hooks - called when navigating to a route
	onNavigateToPosts?: (context: RouteContext) => Promise<void> | void;
	onNavigateToDrafts?: (context: RouteContext) => Promise<void> | void;
	onNavigateToNewPost?: (context: RouteContext) => Promise<void> | void;
	onNavigateToEditPost?: (
		slug: string,
		context: RouteContext,
	) => Promise<void> | void;
	onNavigateToPost?: (
		slug: string,
		context: RouteContext,
	) => Promise<void> | void;

	// Lifecycle Hooks
	onRouteRender?: (
		routeName: string,
		context: RouteContext,
	) => Promise<void> | void;
	onRouteError?: (
		routeName: string,
		error: Error,
		context: RouteContext,
	) => Promise<void> | void;

	// Redirect/Error Handlers
	onUnauthorized?: (routeName: string, path: string) => string; // Return redirect path
	onNotFound?: (routeName: string, path: string) => void;
}

// Loader for SSR prefetching with hooks - configured once
function createPostsLoader(published: boolean, config: BlogClientConfig) {
	return async () => {
		if (typeof window === "undefined") {
			const {
				queryClient,
				baseURL,
				basePath = "/api",
				context: additionalContext,
				hooks,
			} = config;

			const context: LoaderContext = {
				path: published ? "/blog" : "/blog/drafts",
				isSSR: true,
				baseURL,
				basePath,
				...additionalContext,
			};

			try {
				// Before hook
				if (hooks?.beforeLoadPosts) {
					const canLoad = await hooks.beforeLoadPosts({ published }, context);
					if (!canLoad) {
						throw new Error("Load prevented by beforeLoadPosts hook");
					}
				}

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
					published: published,
				});

				await queryClient.prefetchInfiniteQuery({
					...listQuery,
					initialPageParam: 0,
				});

				// After hook - get data from queryClient if needed
				if (hooks?.afterLoadPosts) {
					const posts =
						queryClient.getQueryData<Post[]>(listQuery.queryKey) || null;
					await hooks.afterLoadPosts(posts, { published }, context);
				}
			} catch (error) {
				// Error hook
				if (hooks?.onLoadError) {
					await hooks.onLoadError(error as Error, context);
				}
				throw error;
			}
		}
	};
}

function createPostLoader(slug: string, config: BlogClientConfig) {
	return async () => {
		if (typeof window === "undefined") {
			const {
				queryClient,
				baseURL,
				basePath = "/api",
				context: additionalContext,
				hooks,
			} = config;

			const context: LoaderContext = {
				path: `/blog/${slug}`,
				params: { slug },
				isSSR: true,
				baseURL,
				basePath,
				...additionalContext,
			};

			try {
				// Before hook
				if (hooks?.beforeLoadPost) {
					const canLoad = await hooks.beforeLoadPost(slug, context);
					if (!canLoad) {
						throw new Error("Load prevented by beforeLoadPost hook");
					}
				}

				const client = createApiClient<BlogApiRouter>({
					baseURL: baseURL,
					basePath: basePath,
				});
				const queries = createBlogQueryKeys(client);
				const postQuery = queries.posts.detail(slug);
				await queryClient.prefetchQuery(postQuery);

				// After hook
				if (hooks?.afterLoadPost) {
					const post =
						queryClient.getQueryData<Post>(postQuery.queryKey) || null;
					await hooks.afterLoadPost(post, slug, context);
				}
			} catch (error) {
				// Error hook
				if (hooks?.onLoadError) {
					await hooks.onLoadError(error as Error, context);
				}
				throw error;
			}
		}
	};
}

/**
 * Blog client plugin
 * Provides routes, components, and React Query hooks for blog posts
 *
 * @param config - Configuration including queryClient, baseURL, and optional hooks
 */
export const blogClientPlugin = (config: BlogClientConfig) =>
	defineClientPlugin({
		name: "blog",

		routes: () => ({
			posts: createRoute("/blog", () => ({
				PageComponent: () => <HomePageComponent published={true} />,
				ErrorComponent: DefaultError,
				LoadingComponent: PostsLoading,
				loader: createPostsLoader(true, config),
				meta: (routeConfig: { url: string }) => [
					{ name: "title", content: `Blog Posts` },
					{
						name: "description",
						content: `Read our latest blog posts.`,
					},
				],
			})),
			drafts: createRoute("/blog/drafts", () => ({
				PageComponent: () => <HomePageComponent published={false} />,
				ErrorComponent: DefaultError,
				LoadingComponent: PostsLoading,
				loader: createPostsLoader(false, config),
				meta: (routeConfig: { url: string }) => [
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
				meta: (routeConfig: { url: string }) => [
					{ name: "title", content: `New Post` },
					{
						name: "description",
						content: `Create a new blog post.`,
					},
				],
			})),
			editPost: createRoute("/blog/:slug/edit", ({ params: { slug } }) => ({
				PageComponent: () => <EditPostPageComponent slug={slug} />,
				loader: createPostLoader(slug, config),
				ErrorComponent: DefaultError,
				LoadingComponent: FormLoading,
				meta: (routeConfig: { url: string }) => [
					{ name: "title", content: `Edit Post` },
				],
			})),
			post: createRoute("/blog/:slug", ({ params: { slug } }) => ({
				PageComponent: () => <PostPageComponent slug={slug} />,
				loader: createPostLoader(slug, config),
				ErrorComponent: DefaultError,
				LoadingComponent: FormLoading,
				meta: (routeConfig: { url: string }) => [
					{ name: "title", content: `Post` },
				],
			})),
		}),
	});
