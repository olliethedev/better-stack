"use client";

import { usePluginOverrides } from "@btst/stack/context";
import type { BlogPluginOverrides } from "../../overrides";
import type { SerializedPost } from "../../../types";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@workspace/ui/components/carousel";
import { PostCard as DefaultPostCard } from "./post-card";

interface RecentPostsCarouselProps {
	posts: SerializedPost[];
	ref?: (node: Element | null) => void;
}

export function RecentPostsCarousel({ posts, ref }: RecentPostsCarouselProps) {
	const { PostCard } = usePluginOverrides<BlogPluginOverrides>("blog");
	const PostCardComponent = PostCard || DefaultPostCard;

	return (
		<div className="w-full">
			{/* Ref div to trigger intersection observer when scrolled into view */}
			{ref && <div ref={ref} />}

			{posts && posts.length > 0 && (
				<div data-testid="recent-posts-carousel">
					<div className="mb-4">
						<h2 className="text-2xl font-semibold">Recent Posts</h2>
					</div>

					<Carousel
						opts={{
							align: "start",
							loop: false,
						}}
						className="w-full"
					>
						<CarouselContent className="-ml-2 md:-ml-4">
							{posts.map((post) => (
								<CarouselItem
									key={post.id}
									className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3"
								>
									<PostCardComponent post={post} />
								</CarouselItem>
							))}
						</CarouselContent>
						<CarouselPrevious className="-left-4 md:-left-12" />
						<CarouselNext className="-right-4 md:-right-12" />
					</Carousel>
				</div>
			)}
		</div>
	);
}
