"use client";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { useBasePath, usePluginOverrides } from "@btst/stack/context";
import { formatDate } from "date-fns";
import type { SerializedPost } from "../../../types";
import { CalendarIcon, ImageIcon } from "lucide-react";
import { ArrowRightIcon } from "lucide-react";
import type { BlogPluginOverrides } from "../../overrides";

export function PostCard({ post }: { post: SerializedPost }) {
	const { Link, Image } = usePluginOverrides<BlogPluginOverrides>("blog");
	const LinkComponent = Link || DefaultLink;
	const ImageComponent = Image || DefaultImage;
	const { localization } = {
		localization: {
			BLOG_CARD_DRAFT_BADGE: "Draft",
			BLOG_CARD_READ_MORE: "Read more",
		},
	};
	const basePath = useBasePath();
	const blogPath = `${basePath}/blog/${post.slug}`;
	const postDate = formatDate(
		post.publishedAt || post.createdAt,
		"MMMM d, yyyy",
	);

	return (
		<Card className="group relative flex h-full flex-col gap-2 pt-0 pb-4 transition-shadow duration-200 hover:shadow-lg">
			{/* Featured Image or Placeholder */}
			<LinkComponent
				href={blogPath}
				className="relative block h-48 w-full overflow-hidden rounded-t-xl bg-muted"
			>
				{post.image ? (
					<ImageComponent
						src={post.image}
						alt={post.title}
						className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
						width={500}
						height={300}
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-muted">
						<ImageIcon className="size-18" />
					</div>
				)}
			</LinkComponent>

			{!post.published && (
				<Badge variant="destructive" className="absolute top-2 left-2 text-xs">
					{localization.BLOG_CARD_DRAFT_BADGE}
				</Badge>
			)}

			<CardHeader className="flex-1">
				<div className="mb-2 flex items-center gap-2 text-muted-foreground text-xs">
					<CalendarIcon className="h-3 w-3" />
					<time dateTime={postDate}>{postDate}</time>
				</div>

				<CardTitle className="line-clamp-2 text-lg leading-tight transition-colors">
					<LinkComponent href={blogPath} className="hover:underline">
						{post.title}
					</LinkComponent>
				</CardTitle>
			</CardHeader>

			<CardContent className="flex flex-1 flex-col gap-4">
				{post.excerpt && (
					<CardDescription className="mt-2 line-clamp-3">
						{post.excerpt}
					</CardDescription>
				)}
			</CardContent>

			<CardFooter>
				<div className="flex w-full items-center justify-between">
					<Button asChild variant="link" className="px-0 has-[>svg]:px-0">
						<LinkComponent href={blogPath}>
							{localization.BLOG_CARD_READ_MORE}
							<ArrowRightIcon className="ml-1 h-3 w-3" />
						</LinkComponent>
					</Button>
				</div>
			</CardFooter>
		</Card>
	);
}

const DefaultLink = (props: React.ComponentProps<"a">) => {
	return <a {...props} />;
};

const DefaultImage = (props: React.ComponentProps<"img">) => {
	return <img {...props} />;
};
