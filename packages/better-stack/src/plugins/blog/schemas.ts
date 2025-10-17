import { z } from "zod";

export const createPostSchema = z.object({
	title: z.string().min(1, "Title is required"),
	content: z.string().min(1, "Content is required"),
	excerpt: z.string().optional().default(""),
	slug: z.string().min(1).optional(),
	image: z.string().optional(),
	published: z.boolean().optional().default(false),
	publishedAt: z.coerce.date().optional(),
	authorId: z.string().optional(),
	createdAt: z.coerce.date().optional(),
	updatedAt: z.coerce.date().optional(),
});
export const updatePostSchema = z.object({
	id: z.string().optional(),
	title: z.string().min(1, "Title is required"),
	content: z.string().min(1, "Content is required"),
	excerpt: z.string().optional().default(""),
	slug: z.string().min(1, "Slug is required"),
	image: z.string().optional(),
	published: z.boolean().optional(),
	publishedAt: z.coerce.date().optional(),
	authorId: z.string().optional(),
	createdAt: z.coerce.date().optional(),
	updatedAt: z.coerce.date().optional(),
});
