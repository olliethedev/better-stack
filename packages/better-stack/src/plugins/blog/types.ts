export type Post = {
	id: string;
	authorId?: string;
	defaultLocale?: string;
	slug: string;
	title: string;
	content: string;
	excerpt: string;
	image?: string;
	published: boolean;
	status?: "DRAFT" | "PUBLISHED";
	publishedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
};
