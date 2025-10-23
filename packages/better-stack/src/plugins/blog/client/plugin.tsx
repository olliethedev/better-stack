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

	// Optional SEO/meta configuration
	seo?: {
		siteName?: string;
		author?: string;
		twitterHandle?: string;
		locale?: string;
		defaultImage?: string;
	};

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

// Meta generators with SEO optimization
function createPostsListMeta(config: BlogClientConfig, published: boolean) {
	return () => {
		const { baseURL, seo } = config;
		const path = published ? "/blog" : "/blog/drafts";
		const fullUrl = `${baseURL}${path}`;
		const title = published ? "Blog" : "Draft Posts";
		const description = published
			? "Read our latest articles, insights, and updates on web development, technology, and more."
			: "View and manage your draft blog posts.";

		return [
			// Primary meta tags
			{ name: "title", content: title },
			{ name: "description", content: description },
			{
				name: "keywords",
				content: "blog, articles, technology, web development, insights",
			},
			...(seo?.author ? [{ name: "author", content: seo.author }] : []),
			{
				name: "robots",
				content: published ? "index, follow" : "noindex, nofollow",
			},

			// Open Graph / Facebook
			{ property: "og:type", content: "website" },
			{ property: "og:title", content: title },
			{ property: "og:description", content: description },
			{ property: "og:url", content: fullUrl },
			...(seo?.siteName
				? [{ property: "og:site_name", content: seo.siteName }]
				: []),
			...(seo?.locale ? [{ property: "og:locale", content: seo.locale }] : []),
			...(seo?.defaultImage
				? [{ property: "og:image", content: seo.defaultImage }]
				: []),

			// Twitter Card
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: title },
			{ name: "twitter:description", content: description },
			...(seo?.twitterHandle
				? [{ name: "twitter:site", content: seo.twitterHandle }]
				: []),
		];
	};
}

function createPostMeta(config: BlogClientConfig, slug: string) {
	return () => {
		const { queryClient, baseURL, seo } = config;
		const queries = createBlogQueryKeys(
			createApiClient<BlogApiRouter>({ baseURL, basePath: "/api" }),
		);
		const post = queryClient.getQueryData<Post>(
			queries.posts.detail(slug).queryKey,
		);

		if (!post) {
			// Fallback if post not loaded
			return [
				{ name: "title", content: "Blog Post" },
				{ name: "robots", content: "noindex" },
			];
		}

		const fullUrl = `${baseURL}/blog/${post.slug}`;
		const title = post.title;
		const description = post.excerpt || post.content.substring(0, 160);
		const publishedTime = post.publishedAt
			? new Date(post.publishedAt).toISOString()
			: new Date(post.createdAt).toISOString();
		const modifiedTime = new Date(post.updatedAt).toISOString();
		const image = post.image || seo?.defaultImage;

		return [
			// Primary meta tags
			{ name: "title", content: title },
			{ name: "description", content: description },
			...(post.authorId || seo?.author
				? [{ name: "author", content: post.authorId || seo?.author }]
				: []),
			{
				name: "robots",
				content: post.published ? "index, follow" : "noindex, nofollow",
			},
			{
				name: "keywords",
				content: `blog, article, ${post.slug.replace(/-/g, ", ")}`,
			},

			// Open Graph / Facebook
			{ property: "og:type", content: "article" },
			{ property: "og:title", content: title },
			{ property: "og:description", content: description },
			{ property: "og:url", content: fullUrl },
			...(seo?.siteName
				? [{ property: "og:site_name", content: seo.siteName }]
				: []),
			...(seo?.locale ? [{ property: "og:locale", content: seo.locale }] : []),
			...(image ? [{ property: "og:image", content: image }] : []),
			...(image
				? [
						{ property: "og:image:width", content: "1200" },
						{ property: "og:image:height", content: "630" },
						{ property: "og:image:alt", content: title },
					]
				: []),

			// Article-specific Open Graph tags
			{ property: "article:published_time", content: publishedTime },
			{ property: "article:modified_time", content: modifiedTime },
			...(post.authorId
				? [{ property: "article:author", content: post.authorId }]
				: []),

			// Twitter Card
			{
				name: "twitter:card",
				content: image ? "summary_large_image" : "summary",
			},
			{ name: "twitter:title", content: title },
			{ name: "twitter:description", content: description },
			...(seo?.twitterHandle
				? [{ name: "twitter:site", content: seo.twitterHandle }]
				: []),
			...(post.authorId || seo?.twitterHandle
				? [
						{
							name: "twitter:creator",
							content: post.authorId || seo?.twitterHandle,
						},
					]
				: []),
			...(image ? [{ name: "twitter:image", content: image }] : []),
			...(image ? [{ name: "twitter:image:alt", content: title }] : []),

			// Additional SEO tags
			{ name: "publish_date", content: publishedTime },
		];
	};
}

function createNewPostMeta(config: BlogClientConfig) {
	return () => {
		const { baseURL } = config;
		const fullUrl = `${baseURL}/blog/new`;

		return [
			{ name: "title", content: "Create New Post" },
			{ name: "description", content: "Write and publish a new blog post." },
			{ name: "robots", content: "noindex, nofollow" },

			// Open Graph
			{ property: "og:type", content: "website" },
			{ property: "og:title", content: "Create New Post" },
			{
				property: "og:description",
				content: "Write and publish a new blog post.",
			},
			{ property: "og:url", content: fullUrl },

			// Twitter
			{ name: "twitter:card", content: "summary" },
			{ name: "twitter:title", content: "Create New Post" },
		];
	};
}

function createEditPostMeta(config: BlogClientConfig, slug: string) {
	return () => {
		const { queryClient, baseURL } = config;
		const queries = createBlogQueryKeys(
			createApiClient<BlogApiRouter>({ baseURL, basePath: "/api" }),
		);
		const post = queryClient.getQueryData<Post>(
			queries.posts.detail(slug).queryKey,
		);
		const fullUrl = `${baseURL}/blog/${slug}/edit`;

		const title = post ? `Edit: ${post.title}` : "Edit Post";

		return [
			{ name: "title", content: title },
			{ name: "description", content: "Edit your blog post." },
			{ name: "robots", content: "noindex, nofollow" },

			// Open Graph
			{ property: "og:type", content: "website" },
			{ property: "og:title", content: title },
			{ property: "og:url", content: fullUrl },

			// Twitter
			{ name: "twitter:card", content: "summary" },
			{ name: "twitter:title", content: title },
		];
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
				meta: createPostsListMeta(config, true),
			})),
			drafts: createRoute("/blog/drafts", () => ({
				PageComponent: () => <HomePageComponent published={false} />,
				ErrorComponent: DefaultError,
				LoadingComponent: PostsLoading,
				loader: createPostsLoader(false, config),
				meta: createPostsListMeta(config, false),
			})),
			newPost: createRoute("/blog/new", () => ({
				PageComponent: NewPostPageComponent,
				ErrorComponent: DefaultError,
				LoadingComponent: FormLoading,
				meta: createNewPostMeta(config),
			})),
			editPost: createRoute("/blog/:slug/edit", ({ params: { slug } }) => ({
				PageComponent: () => <EditPostPageComponent slug={slug} />,
				loader: createPostLoader(slug, config),
				ErrorComponent: DefaultError,
				LoadingComponent: FormLoading,
				meta: createEditPostMeta(config, slug),
			})),
			post: createRoute("/blog/:slug", ({ params: { slug } }) => ({
				PageComponent: () => <PostPageComponent slug={slug} />,
				loader: createPostLoader(slug, config),
				ErrorComponent: DefaultError,
				LoadingComponent: FormLoading,
				meta: createPostMeta(config, slug),
			})),
		}),
	});
