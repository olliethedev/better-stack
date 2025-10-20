"use client";

import { createApiClient } from "@btst/stack/plugins";
import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseInfiniteQuery,
	useSuspenseQuery,
	type InfiniteData,
} from "@tanstack/react-query";
import type { Post, SerializedPost } from "../../types";
import type { BlogApiRouter } from "../../api/plugin";
import { useDebounce } from "./use-debounce";
import { useEffect, useRef } from "react";
import { z } from "zod";
import { createPostSchema, updatePostSchema } from "../../schemas";
import { createBlogQueryKeys } from "../../query-keys";
import { usePluginOverrides } from "@btst/stack/context";
import type { BlogPluginOverrides } from "../overrides";

/**
 * Shared React Query configuration for all blog queries
 * Prevents automatic refetching to avoid hydration mismatches in SSR
 */
const SHARED_QUERY_CONFIG = {
	retry: false,
	refetchOnWindowFocus: false,
	refetchOnMount: false,
	refetchOnReconnect: false,
	staleTime: 1000 * 60 * 5, // 5 minutes
	gcTime: 1000 * 60 * 10, // 10 minutes
} as const;

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
	post: SerializedPost | null;
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
	const { tag, limit = 10, enabled = true, query, published } = options;
	const queries = createBlogQueryKeys(client);

	const queryParams = {
		tag,
		limit,
		query,
		published,
	};

	const basePosts = queries.posts.list(queryParams);

	const {
		data,
		isLoading,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		refetch,
	} = useInfiniteQuery({
		...basePosts,
		...SHARED_QUERY_CONFIG,
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages) => {
			const posts = lastPage as Post[];
			if (posts.length < limit) return undefined;
			return allPages.length * limit;
		},
		enabled: enabled && !!client,
	});

	const posts = ((
		data as InfiniteData<Post[], number> | undefined
	)?.pages?.flat() ?? []) as Post[];

	return {
		posts,
		isLoading,
		error,
		loadMore: fetchNextPage,
		hasMore: !!hasNextPage,
		isLoadingMore: isFetchingNextPage,
		refetch,
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
	const { tag, limit = 10, enabled = true, query, published } = options;
	const queries = createBlogQueryKeys(client);

	const queryParams = { tag, limit, query, published };
	const basePosts = queries.posts.list(queryParams);

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
		useSuspenseInfiniteQuery({
			...basePosts,
			...SHARED_QUERY_CONFIG,
			initialPageParam: 0,
			getNextPageParam: (lastPage, allPages) => {
				const posts = lastPage as Post[];
				if (posts.length < limit) return undefined;
				return allPages.length * limit;
			},
		});

	const posts = (data.pages?.flat() ?? []) as Post[];

	return {
		posts,
		loadMore: fetchNextPage,
		hasMore: !!hasNextPage,
		isLoadingMore: isFetchingNextPage,
		refetch,
	};
}

/**
 * Hook for fetching a single post by slug
 */
export function usePost(slug?: string): UsePostResult {
	const client = createApiClient<BlogApiRouter>({ baseURL: "/api" });
	const queries = createBlogQueryKeys(client);

	const basePost = queries.posts.detail(slug ?? "");
	const { data, isLoading, error, refetch } = useQuery<
		SerializedPost | null,
		Error,
		SerializedPost | null,
		typeof basePost.queryKey
	>({
		...basePost,
		...SHARED_QUERY_CONFIG,
		enabled: !!client && !!slug,
	});

	return {
		post: data || null,
		isLoading,
		error,
		refetch,
	};
}

/** Suspense variant of usePost */
export function useSuspensePost(slug: string): {
	post: SerializedPost | null;
	refetch: () => Promise<unknown>;
} {
	const client = createApiClient<BlogApiRouter>({ baseURL: "/api" });
	const queries = createBlogQueryKeys(client);
	const basePost = queries.posts.detail(slug);
	const { data, refetch } = useSuspenseQuery<
		SerializedPost | null,
		Error,
		SerializedPost | null,
		typeof basePost.queryKey
	>({
		...basePost,
		...SHARED_QUERY_CONFIG,
	});
	return { post: data || null, refetch };
}

/** Create a new post */
export function useCreatePost() {
	const client = createApiClient<BlogApiRouter>({ baseURL: "/api" });
	const queryClient = useQueryClient();
	const queries = createBlogQueryKeys(client);
	const { refresh } = usePluginOverrides<BlogPluginOverrides>("blog");

	return useMutation<SerializedPost | null, Error, PostCreateInput>({
		mutationKey: [...queries.posts._def, "create"],
		mutationFn: async (postData: PostCreateInput) => {
			const response = await client("@post/posts", {
				method: "POST",
				body: postData,
			});
			return response.data as SerializedPost | null;
		},
		onSuccess: async (created) => {
			// Update detail cache if available
			if (created?.slug) {
				queryClient.setQueryData(
					queries.posts.detail(created.slug).queryKey,
					created,
				);
			}
			// Invalidate lists scoped to posts and drafts - wait for completion
			await queryClient.invalidateQueries({
				queryKey: queries.posts.list._def,
			});
			await queryClient.invalidateQueries({
				queryKey: queries.drafts.list._def,
			});
			// Refresh server-side cache (Next.js router cache)
			if (refresh) {
				await refresh();
			}
		},
	});
}

/** Update an existing post by id */
export function useUpdatePost() {
	const client = createApiClient<BlogApiRouter>({ baseURL: "/api" });
	const queryClient = useQueryClient();
	const queries = createBlogQueryKeys(client);
	const { refresh } = usePluginOverrides<BlogPluginOverrides>("blog");

	return useMutation<
		SerializedPost | null,
		Error,
		{ id: string; data: PostUpdateInput }
	>({
		mutationKey: [...queries.posts._def, "update"],
		mutationFn: async ({ id, data }: { id: string; data: PostUpdateInput }) => {
			const response = await client(`@put/posts/:id`, {
				method: "PUT",
				params: { id },
				body: data,
			});
			return response.data as SerializedPost | null;
		},
		onSuccess: async (updated) => {
			// Update detail cache if available
			if (updated?.slug) {
				queryClient.setQueryData(
					queries.posts.detail(updated.slug).queryKey,
					updated,
				);
			}
			// Invalidate lists scoped to posts and drafts - wait for completion
			await queryClient.invalidateQueries({
				queryKey: queries.posts.list._def,
			});
			await queryClient.invalidateQueries({
				queryKey: queries.drafts.list._def,
			});
			// Refresh server-side cache (Next.js router cache)
			if (refresh) {
				await refresh();
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
