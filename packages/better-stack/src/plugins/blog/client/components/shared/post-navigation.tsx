"use client";

import { usePluginOverrides, useBasePath } from "@btst/stack/context";
import { Button } from "@workspace/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BlogPluginOverrides } from "../../overrides";
import { DefaultLink } from "./defaults";
import type { SerializedPost } from "../../../types";

interface PostNavigationProps {
	previousPost: SerializedPost | null;
	nextPost: SerializedPost | null;
	ref?: (node: Element | null) => void;
}

export function PostNavigation({
	previousPost,
	nextPost,
	ref,
}: PostNavigationProps) {
	const { Link } = usePluginOverrides<
		BlogPluginOverrides,
		Partial<BlogPluginOverrides>
	>("blog", {
		Link: DefaultLink,
	});
	const basePath = useBasePath();
	const blogPath = `${basePath}/blog`;

	return (
		<>
			{/* Ref div to trigger intersection observer when scrolled into view */}
			{ref && <div ref={ref} />}

			{/* Only show navigation buttons if posts are available */}
			{(previousPost || nextPost) && (
				<div className="flex flex-col sm:flex-row gap-4 mt-8 pt-8 border-t w-full justify-between">
					{previousPost ? (
						<Link
							data-testid="previous-post-link"
							href={`${blogPath}/${previousPost.slug}`}
							className="flex-1 sm:max-w-1/3"
						>
							<Button
								variant="outline"
								className="w-full justify-start h-auto py-4 px-4 whitespace-normal!"
							>
								<div className="flex items-center gap-2 w-full min-w-0">
									<ChevronLeft className="h-4 w-4 shrink-0" />
									<div className="flex flex-col items-start min-w-0 flex-1">
										<span className="text-xs text-muted-foreground">
											Previous
										</span>
										<div className="text-sm font-medium w-full text-ellipsis line-clamp-2 text-left">
											{previousPost.title}
										</div>
									</div>
								</div>
							</Button>
						</Link>
					) : (
						<div className="flex-1" />
					)}

					{nextPost ? (
						<Link
							data-testid="next-post-link"
							href={`${blogPath}/${nextPost.slug}`}
							className="flex-1 sm:max-w-1/3"
						>
							<Button
								variant="outline"
								className="w-full justify-end h-auto py-4 px-4 whitespace-normal!"
							>
								<div className="flex items-center gap-2 w-full min-w-0">
									<div className="flex flex-col items-end min-w-0 flex-1">
										<span className="text-xs text-muted-foreground">Next</span>
										<div className="text-sm font-medium w-full text-ellipsis line-clamp-2 text-right">
											{nextPost.title}
										</div>
									</div>
									<ChevronRight className="h-4 w-4 shrink-0" />
								</div>
							</Button>
						</Link>
					) : (
						<div className="flex-1" />
					)}
				</div>
			)}
		</>
	);
}
