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
	published: z.coerce.boolean().optional(),
});

/**
 * Blog backend plugin
 * Provides API endpoints for managing blog posts
 * Uses better-db adapter for database operations
 */
export const blogBackendPlugin = defineBackendPlugin({
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
									},
								]
							: []),
						...(query.slug
							? [{ field: "slug", value: query.slug, operator: "eq" as const }]
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
				return posts || [];
			},
		);

		const createPost = createEndpoint(
			"/posts",
			{
				method: "POST",
				body: createPostSchema,
			},
			async (ctx) => {
				const newPost = await adapter.create<Post>({
					model: "post",
					data: {
						...ctx.body,
						slug: ctx.body.slug ? ctx.body.slug : slugify(ctx.body.title),
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});
				return newPost;
			},
		);

		const updatePost = createEndpoint(
			"/posts/:id",
			{
				method: "PUT",
				body: updatePostSchema,
			},
			async (ctx) => {
				const updated = await adapter.update<Post>({
					model: "post",
					where: [{ field: "id", value: ctx.params.id }],
					update: ctx.body,
				});

				if (!updated) {
					throw new Error("Post not found");
				}

				return updated;
			},
		);

		const deletePost = createEndpoint(
			"/posts/:id",
			{
				method: "DELETE",
			},
			async (ctx) => {
				await adapter.delete<Post>({
					model: "post",
					where: [{ field: "id", value: ctx.params.id }],
				});
				return { success: true };
			},
		);

		return {
			listPosts,
			createPost,
			updatePost,
			deletePost,
		} as const;
	},
});

export type BlogApiRouter = ReturnType<typeof blogBackendPlugin.routes>;
