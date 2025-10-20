import { z } from "zod";

const dateFields = {
	publishedAt: z.coerce.date().optional(),
	createdAt: z.coerce.date().optional(),
	updatedAt: z.coerce.date().optional(),
};

const coreFields = {
	title: z.string().min(1, "Title is required"),
	content: z.string().min(1, "Content is required"),
	excerpt: z.string().optional().default(""),
	image: z.string().optional(),
	published: z.boolean().optional().default(false),
	slug: z.string().min(1, "Slug is required"),
};

export const PostDomainSchema = z.object({
	id: z.string().optional(),
	...coreFields,
	...dateFields,
});

export const createPostSchema = PostDomainSchema.extend({
	slug: PostDomainSchema.shape.slug.optional(),
}).omit({ id: true }); // no id on create

export const updatePostSchema = PostDomainSchema.extend({
	id: z.string(), // required on update
});
