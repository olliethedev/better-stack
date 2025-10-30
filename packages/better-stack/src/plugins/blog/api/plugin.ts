import type { Adapter } from "@btst/db";
import { defineBackendPlugin } from "@btst/stack/plugins";
import { createEndpoint } from "@btst/stack/api";
import { z } from "zod";
import { blogSchema as dbSchema } from "../db";
import type { Post } from "../types";
import { slugify } from "../utils";
import { createPostSchema, updatePostSchema } from "../schemas";

export const PostListQuerySchema = z.object({
	slug: z.string().optional(),
	offset: z.coerce.number().int().min(0).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
	query: z.string().optional(),
	published: z
		.string()
		.optional()
		.transform((val) => {
			if (val === undefined) return undefined;
			if (val === "true") return true;
			if (val === "false") return false;
			return undefined;
		}),
});

export const NextPreviousPostsQuerySchema = z.object({
	date: z.coerce.date(),
});

/**
 * Context passed to blog API hooks
 */
export interface BlogApiContext<TBody = any, TParams = any, TQuery = any> {
	body?: TBody;
	params?: TParams;
	query?: TQuery;
	request?: Request;
	[key: string]: any;
}

/**
 * Configuration hooks for blog backend plugin
 * All hooks are optional and allow consumers to customize behavior
 */
export interface BlogBackendHooks {
	// Authorization hooks - called before the operation
	canListPosts?: (
		filter: z.infer<typeof PostListQuerySchema>,
		context: BlogApiContext,
	) => Promise<boolean> | boolean;
	canCreatePost?: (
		data: z.infer<typeof createPostSchema>,
		context: BlogApiContext,
	) => Promise<boolean> | boolean;
	canUpdatePost?: (
		postId: string,
		data: z.infer<typeof updatePostSchema>,
		context: BlogApiContext,
	) => Promise<boolean> | boolean;
	canDeletePost?: (
		postId: string,
		context: BlogApiContext,
	) => Promise<boolean> | boolean;

	// Lifecycle hooks - called after the operation
	onPostsRead?: (
		posts: Post[],
		filter: z.infer<typeof PostListQuerySchema>,
		context: BlogApiContext,
	) => Promise<void> | void;
	onPostCreated?: (post: Post, context: BlogApiContext) => Promise<void> | void;
	onPostUpdated?: (post: Post, context: BlogApiContext) => Promise<void> | void;
	onPostDeleted?: (
		postId: string,
		context: BlogApiContext,
	) => Promise<void> | void;

	// Error hooks - called when operations fail
	onListPostsError?: (
		error: Error,
		context: BlogApiContext,
	) => Promise<void> | void;
	onCreatePostError?: (
		error: Error,
		context: BlogApiContext,
	) => Promise<void> | void;
	onUpdatePostError?: (
		error: Error,
		context: BlogApiContext,
	) => Promise<void> | void;
	onDeletePostError?: (
		error: Error,
		context: BlogApiContext,
	) => Promise<void> | void;
}

/**
 * Blog backend plugin
 * Provides API endpoints for managing blog posts
 * Uses better-db adapter for database operations
 *
 * @param hooks - Optional configuration hooks for customizing plugin behavior
 */
export const blogBackendPlugin = (hooks?: BlogBackendHooks) =>
	defineBackendPlugin({
		name: "blog",

		dbPlugin: dbSchema,

		routes: (adapter: Adapter) => {
			const listPosts = createEndpoint(
				"/posts",
				{
					method: "GET",
					query: PostListQuerySchema,
				},
				async ({ query }) => {
					const context: BlogApiContext = { query };

					try {
						// Authorization hook
						if (hooks?.canListPosts) {
							const canList = await hooks.canListPosts(query, context);
							if (!canList) {
								throw new Error("Unauthorized: Cannot list posts");
							}
						}

						// Fetch posts
						const posts = await adapter.findMany<Post>({
							model: "post",
							limit: query.limit ?? 10,
							offset: query.offset ?? 0,
							where: [
								...(query.query
									? [
											{
												field: "title",
												value: query.query,
												operator: "contains" as const,
												connector: "OR" as const,
											},
											{
												field: "content",
												value: query.query,
												operator: "contains" as const,
												connector: "OR" as const,
											},
											{
												field: "excerpt",
												value: query.query,
												operator: "contains" as const,
												connector: "OR" as const,
											},
										]
									: []),
								...(query.slug
									? [
											{
												field: "slug",
												value: query.slug,
												operator: "eq" as const,
											},
										]
									: []),
								...(query.published !== undefined
									? [
											{
												field: "published",
												value: query.published,
												operator: "eq" as const,
											},
										]
									: []),
							],
							sortBy: {
								field: "createdAt",
								direction: "desc",
							},
						});

						const result = posts || [];

						// Lifecycle hook
						if (hooks?.onPostsRead) {
							await hooks.onPostsRead(result, query, context);
						}

						return result;
					} catch (error) {
						// Error hook
						if (hooks?.onListPostsError) {
							await hooks.onListPostsError(error as Error, context);
						}
						throw error;
					}
				},
			);
			const createPost = createEndpoint(
				"/posts",
				{
					method: "POST",
					body: createPostSchema,
				},
				async (ctx) => {
					const context: BlogApiContext = { body: ctx.body };

					try {
						// Authorization hook
						if (hooks?.canCreatePost) {
							const canCreate = await hooks.canCreatePost(ctx.body, context);
							if (!canCreate) {
								throw new Error("Unauthorized: Cannot create post");
							}
						}

						// Create post
						const newPost = await adapter.create<Post>({
							model: "post",
							data: {
								...ctx.body,
								slug: ctx.body.slug ? ctx.body.slug : slugify(ctx.body.title),
								createdAt: new Date(),
								updatedAt: new Date(),
							},
						});

						// Lifecycle hook
						if (hooks?.onPostCreated) {
							await hooks.onPostCreated(newPost, context);
						}

						return newPost;
					} catch (error) {
						// Error hook
						if (hooks?.onCreatePostError) {
							await hooks.onCreatePostError(error as Error, context);
						}
						throw error;
					}
				},
			);
			const updatePost = createEndpoint(
				"/posts/:id",
				{
					method: "PUT",
					body: updatePostSchema,
				},
				async (ctx) => {
					const context: BlogApiContext = {
						body: ctx.body,
						params: ctx.params,
					};

					try {
						// Authorization hook
						if (hooks?.canUpdatePost) {
							const canUpdate = await hooks.canUpdatePost(
								ctx.params.id,
								ctx.body,
								context,
							);
							if (!canUpdate) {
								throw new Error("Unauthorized: Cannot update post");
							}
						}

						// Update post
						const updated = await adapter.update<Post>({
							model: "post",
							where: [{ field: "id", value: ctx.params.id }],
							update: ctx.body,
						});

						if (!updated) {
							throw new Error("Post not found");
						}

						// Lifecycle hook
						if (hooks?.onPostUpdated) {
							await hooks.onPostUpdated(updated, context);
						}

						return updated;
					} catch (error) {
						// Error hook
						if (hooks?.onUpdatePostError) {
							await hooks.onUpdatePostError(error as Error, context);
						}
						throw error;
					}
				},
			);
			const deletePost = createEndpoint(
				"/posts/:id",
				{
					method: "DELETE",
				},
				async (ctx) => {
					const context: BlogApiContext = { params: ctx.params };

					try {
						// Authorization hook
						if (hooks?.canDeletePost) {
							const canDelete = await hooks.canDeletePost(
								ctx.params.id,
								context,
							);
							if (!canDelete) {
								throw new Error("Unauthorized: Cannot delete post");
							}
						}

						// Delete post
						await adapter.delete<Post>({
							model: "post",
							where: [{ field: "id", value: ctx.params.id }],
						});

						// Lifecycle hook
						if (hooks?.onPostDeleted) {
							await hooks.onPostDeleted(ctx.params.id, context);
						}

						return { success: true };
					} catch (error) {
						// Error hook
						if (hooks?.onDeletePostError) {
							await hooks.onDeletePostError(error as Error, context);
						}
						throw error;
					}
				},
			);

			const getNextPreviousPosts = createEndpoint(
				"/posts/next-previous",
				{
					method: "GET",
					query: NextPreviousPostsQuerySchema,
				},
				async ({ query }) => {
					const context: BlogApiContext = { query };

					try {
						// Authorization hook
						if (hooks?.canListPosts) {
							const canList = await hooks.canListPosts(
								{ published: true },
								context,
							);
							if (!canList) {
								throw new Error("Unauthorized: Cannot list posts");
							}
						}

						const date = query.date;

						// Get previous post (createdAt < date, newest first)
						const previousPost = await adapter.findMany<Post>({
							model: "post",
							limit: 1,
							where: [
								{
									field: "createdAt",
									value: date,
									operator: "lt" as const,
								},
								{
									field: "published",
									value: true,
									operator: "eq" as const,
								},
							],
							sortBy: {
								field: "createdAt",
								direction: "desc",
							},
						});

						// Get next post (createdAt > date, oldest first)
						const nextPost = await adapter.findMany<Post>({
							model: "post",
							limit: 1,
							where: [
								{
									field: "createdAt",
									value: date,
									operator: "gt" as const,
								},
								{
									field: "published",
									value: true,
									operator: "eq" as const,
								},
							],
							sortBy: {
								field: "createdAt",
								direction: "asc",
							},
						});

						return {
							previous: previousPost?.[0] || null,
							next: nextPost?.[0] || null,
						};
					} catch (error) {
						// Error hook
						if (hooks?.onListPostsError) {
							await hooks.onListPostsError(error as Error, context);
						}
						throw error;
					}
				},
			);

			return {
				listPosts,
				createPost,
				updatePost,
				deletePost,
				getNextPreviousPosts,
			} as const;
		},
	});

export type BlogApiRouter = ReturnType<
	ReturnType<typeof blogBackendPlugin>["routes"]
>;
