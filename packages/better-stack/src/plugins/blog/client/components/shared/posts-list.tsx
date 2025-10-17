import { usePluginOverrides } from "@btst/stack/context";
import type { Post } from "../../../types";
import { Button } from "../ui/button";
import { EmptyList } from "./empty-list";
import SearchInput from "./search-input";
import type { BlogPluginOverrides } from "../../overrides";
import { PostCard as DefaultPostCard } from "./post-card";

interface PostsListProps {
	posts: Post[];
	onLoadMore?: () => void;
	hasMore?: boolean;
	isLoadingMore?: boolean;
}

export function PostsList({
	posts,
	onLoadMore,
	hasMore,
	isLoadingMore,
}: PostsListProps) {
	const { localization } = {
		localization: {
			BLOG_LIST_EMPTY: "No posts found",
			BLOG_LIST_SEARCH_PLACEHOLDER: "Search for a post",
			BLOG_LIST_SEARCH_BUTTON: "Search",
			BLOG_LIST_SEARCH_EMPTY: "No posts found",
			BLOG_LIST_LOADING_MORE: "Loading more...",
			BLOG_LIST_LOAD_MORE: "Load more",
		},
	};
	const { PostCard } = usePluginOverrides<BlogPluginOverrides>("blog");

	const PostCardComponent = PostCard || DefaultPostCard;
	if (posts.length === 0) {
		return <EmptyList message={localization.BLOG_LIST_EMPTY} />;
	}

	return (
		<div className="w-full space-y-6">
			<div className="flex justify-center pb-6">
				<SearchInput
					placeholder={localization.BLOG_LIST_SEARCH_PLACEHOLDER}
					buttonText={localization.BLOG_LIST_SEARCH_BUTTON}
					emptyMessage={localization.BLOG_LIST_SEARCH_EMPTY}
				/>
			</div>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{posts.map((post) => (
					<PostCardComponent key={post.id} post={post} />
				))}
			</div>

			{onLoadMore && hasMore && (
				<div className="flex justify-center">
					<Button
						onClick={onLoadMore}
						disabled={isLoadingMore}
						variant="outline"
						size="lg"
					>
						{isLoadingMore
							? localization.BLOG_LIST_LOADING_MORE
							: localization.BLOG_LIST_LOAD_MORE}
					</Button>
				</div>
			)}
		</div>
	);
}
