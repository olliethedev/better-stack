"use client";

import { createApiClient } from "@btst/stack/plugins";
import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import type { Post } from "../../types";
import type { BlogApiRouter } from "../../api/plugin";
import { useDebounce } from "./use-debounce";
import { useEffect, useRef } from "react";
import { z } from "zod";
import { createPostSchema, updatePostSchema } from "../../schemas";

export interface UsePostsOptions {
	tag?: string;
	limit?: number;
	enabled?: boolean;
	query?: string;
	published?: boolean;
	slug?: string;
}

export interface UsePostsResult {
	posts: Post[];
	isLoading: boolean;
	error: Error | null;
	loadMore: () => void;
	hasMore: boolean;
	isLoadingMore: boolean;
	refetch: () => void;
}

export interface UsePostSearchOptions {
	query: string;
	enabled?: boolean;
	debounceMs?: number;
	limit?: number;
}

export interface UsePostSearchResult {
	posts: Post[];
	data: Post[];
	isLoading: boolean;
	error: Error | null;
	refetch: () => void;
	isSearching: boolean;
	searchQuery: string;
}

export interface UsePostResult {
	post: Post | null;
	isLoading: boolean;
	error: Error | null;
	refetch: () => void;
}

export type PostCreateInput = z.infer<typeof createPostSchema>;
export type PostUpdateInput = z.infer<typeof updatePostSchema>;

/**
 * Hook for fetching paginated posts with load more functionality
 */
export function usePosts(options: UsePostsOptions = {}): UsePostsResult {
	const client = createApiClient<BlogApiRouter>({ baseURL: "/api" });
	const limit = options.limit ?? 10;

	const query = useInfiniteQuery<Post[], Error>({
		queryKey: [
			"blog",
			"posts",
			{
				slug: options.slug,
				query: options.query,
				published: options.published,
				limit,
			},
		],
		enabled: options.enabled ?? true,
		initialPageParam: 0,
		queryFn: async ({ pageParam }) => {
			const response = await client("/posts", {
				method: "GET",
				query: {
					offset: Number(pageParam) || 0,
					limit,
					slug: options.slug,
					query: options.query,
					published: options.published,
				},
			});
			return response.data ?? [];
		},
		getNextPageParam: (lastPage, allPages, lastPageParam) => {
			const nextOffset = (Number(lastPageParam) || 0) + limit;
			return lastPage.length < limit ? undefined : nextOffset;
		},
	});

	const pages = (query.data?.pages as Post[][] | undefined) ?? [];

	const posts = pages.flat();

	return {
		posts,
		isLoading: query.isLoading,
		error: query.error ?? null,
		loadMore: () => {
			void query.fetchNextPage();
		},
		hasMore: query.hasNextPage ?? false,
		isLoadingMore: query.isFetchingNextPage,
		refetch: () => {
			void query.refetch();
		},
	};
}

/** Suspense variant of usePosts */
export function useSuspensePosts(options: UsePostsOptions = {}): {
	posts: Post[];
	loadMore: () => Promise<unknown>;
	hasMore: boolean;
	isLoadingMore: boolean;
	refetch: () => Promise<unknown>;
} {
	const client = createApiClient<BlogApiRouter>({ baseURL: "/api" });
	const limit = options.limit ?? 10;

	const queryKey = [
		"blog",
		"posts",
		{
			slug: options.slug,
			query: options.query,
			published: options.published,
			limit,
		},
	] as const;

	console.log("[Client] useSuspensePosts queryKey:", JSON.stringify(queryKey));

	const query = useSuspenseInfiniteQuery<Post[], Error>({
		queryKey,
		initialPageParam: 0,
		queryFn: async ({ pageParam }) => {
			console.log("[Client] Fetching blog posts, pageParam:", pageParam);
			const response = await client("/posts", {
				method: "GET",
				query: {
					offset: Number(pageParam) || 0,
					limit,
					slug: options.slug,
					query: options.query,
					published: options.published,
				},
			});
			console.log(
				"[Client] Fetched blog posts:",
				response.data?.length ?? 0,
				"posts",
			);
			return response.data ?? [];
		},
		getNextPageParam: (lastPage, _allPages, lastPageParam) => {
			const nextOffset = (Number(lastPageParam) || 0) + limit;
			return lastPage.length < limit ? undefined : nextOffset;
		},
	});

	const pages = (query.data.pages as Post[][] | undefined) ?? [];
	const posts = pages.flat();

	return {
		posts,
		loadMore: query.fetchNextPage,
		hasMore: query.hasNextPage ?? false,
		isLoadingMore: query.isFetchingNextPage,
		refetch: query.refetch,
	};
}

/** Fetch a single post by slug */
export function usePost(slug?: string): UsePostResult {
	const client = createApiClient<BlogApiRouter>({ baseURL: "/api" });

	const baseKey = ["blog", "post", { slug: slug ?? "" }] as const;

	const query = useQuery<Post | null, Error, Post | null, typeof baseKey>({
		queryKey: baseKey,
		enabled: !!slug,
		retry: false,
		refetchOnWindowFocus: false,
		staleTime: 1000 * 60 * 5,
		gcTime: 1000 * 60 * 10,
		queryFn: async () => {
			if (!slug) return null;
			const response = await client("/posts", {
				method: "GET",
				query: { slug, limit: 1 },
			});
			const list = (response.data ?? []) as Post[];
			return list[0] ?? null;
		},
	});

	return {
		post: query.data ?? null,
		isLoading: query.isLoading,
		error: query.error ?? null,
		refetch: () => {
			void query.refetch();
		},
	};
}

/** Create a new post */
export function useCreatePost() {
	const client = createApiClient<BlogApiRouter>({ baseURL: "/api" });
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (postData: PostCreateInput) => {
			const response = await client("@post/posts", {
				method: "POST",
				body: postData,
			});
			return response.data as Post;
		},
		onSuccess: (created) => {
			void queryClient.invalidateQueries({ queryKey: ["blog", "posts"] });
			if (created?.slug) {
				void queryClient.invalidateQueries({
					queryKey: ["blog", "post", { slug: created.slug }],
				});
			}
		},
	});
}

/** Update an existing post by id */
export function useUpdatePost() {
	const client = createApiClient<BlogApiRouter>({ baseURL: "/api" });
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, data }: { id: string; data: PostUpdateInput }) => {
			const response = await client(`@put/posts/:id`, {
				method: "PUT",
				params: { id },
				body: data,
			});
			return response.data as Post;
		},
		onSuccess: (updated) => {
			void queryClient.invalidateQueries({ queryKey: ["blog", "posts"] });
			if (updated?.slug) {
				void queryClient.invalidateQueries({
					queryKey: ["blog", "post", { slug: updated.slug }],
				});
			}
		},
	});
}

/**
 * Hook for searching posts by a free-text query. Uses `usePosts` under the hood.
 * Debounces the query and preserves last successful results to avoid flicker.
 */
export function usePostSearch({
	query,
	enabled = true,
	debounceMs = 300,
	limit = 10,
}: UsePostSearchOptions): UsePostSearchResult {
	const debouncedQuery = useDebounce(query, debounceMs);
	const shouldSearch = enabled && (query?.trim().length ?? 0) > 0;

	const lastResultsRef = useRef<Post[]>([]);

	// Only enable the query when there is an actual search term
	// This prevents empty searches from using the base posts query
	const { posts, isLoading, error, refetch } = usePosts({
		query: debouncedQuery,
		limit,
		enabled: shouldSearch && debouncedQuery.trim() !== "",
	});

	// If search is disabled or query is empty, always return empty results
	const effectivePosts = shouldSearch ? posts : [];

	useEffect(() => {
		if (!isLoading && posts && posts.length >= 0) {
			lastResultsRef.current = posts;
		}
	}, [posts, isLoading]);

	const isDebouncing = enabled && debounceMs > 0 && debouncedQuery !== query;
	const effectiveLoading = isLoading || isDebouncing;
	// During loading, use the last results
	// For empty searches or when disabled, use empty array
	const dataToReturn = !shouldSearch
		? []
		: effectiveLoading
			? lastResultsRef.current
			: effectivePosts;

	return {
		posts: dataToReturn,
		// compatibility alias similar to tanstack useQuery
		data: dataToReturn,
		isLoading: effectiveLoading,
		error,
		refetch,
		isSearching: effectiveLoading,
		searchQuery: debouncedQuery,
	};
}
