import {
	mergeQueryKeys,
	createQueryKeys,
} from "@lukemorales/query-key-factory";
import type { BlogApiRouter } from "./api";
import { createApiClient } from "@btst/stack/plugins";
import type { SerializedPost } from "./types";

interface PostsListParams {
	query?: string;
	limit?: number;
	published?: boolean;
}

export function createBlogQueryKeys(
	client: ReturnType<typeof createApiClient<BlogApiRouter>>,
) {
	const posts = createPostsQueries(client);
	const drafts = createDraftsQueries(client);

	return mergeQueryKeys(posts, drafts);
}

function createPostsQueries(
	client: ReturnType<typeof createApiClient<BlogApiRouter>>,
) {
	return createQueryKeys("posts", {
		list: (params?: PostsListParams) => ({
			queryKey: [
				{
					query:
						params?.query !== undefined && params?.query?.trim() === ""
							? undefined
							: params?.query,
					limit: params?.limit ?? 10,
					published: params?.published ?? true,
				},
			],
			queryFn: async ({ pageParam }: { pageParam?: number }) => {
				const response = await client("/posts", {
					method: "GET",
					query: {
						query: params?.query,
						offset: pageParam ?? 0,
						limit: params?.limit ?? 10,
						published: params?.published ? "true" : "false",
					},
				});
				return (response.data ?? []) as unknown as SerializedPost[];
			},
		}),

		// Simplified detail query
		detail: (slug: string) => ({
			queryKey: [slug],
			queryFn: async () => {
				if (!slug) return null;

				const response = await client("/posts", {
					method: "GET",
					query: { slug, limit: 1 },
				});
				return (response.data?.[0] ?? null) as unknown as SerializedPost | null;
			},
		}),

		// Next/previous posts query
		nextPrevious: (date: Date | string) => ({
			queryKey: ["nextPrevious", date],
			queryFn: async () => {
				const dateValue = typeof date === "string" ? new Date(date) : date;
				const response = await client("/posts/next-previous", {
					method: "GET",
					query: {
						date: dateValue.toISOString(),
					},
				});
				return response.data as {
					previous: SerializedPost | null;
					next: SerializedPost | null;
				};
			},
		}),
	});
}

function createDraftsQueries(
	client: ReturnType<typeof createApiClient<BlogApiRouter>>,
) {
	return createQueryKeys("drafts", {
		list: (params?: PostsListParams) => ({
			queryKey: [
				{
					...(params?.limit && { limit: params.limit }),
				},
			],
			queryFn: async ({ pageParam }: { pageParam?: number }) => {
				const response = await client("/posts", {
					method: "GET",
					query: {
						query: params?.query,
						offset: pageParam ?? 0,
						limit: params?.limit ?? 10,
						published: "false",
					},
				});
				return (response.data ?? []) as unknown as SerializedPost[];
			},
		}),
	});
}
