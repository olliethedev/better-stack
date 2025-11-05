"use client";

import { useEffect, useState, useMemo } from "react";
import { cn, slugify } from "../../../utils";
import { usePluginOverrides } from "@btst/stack/context";
import type { BlogPluginOverrides } from "../../overrides";
import { BLOG_LOCALIZATION } from "../../localization";

interface Heading {
	id: string;
	text: string;
	level: number;
}

interface OnThisPageProps {
	markdown: string;
	className?: string;
}

function extractHeadings(markdown: string): Heading[] {
	const headings: Heading[] = [];
	const lines = markdown.split("\n");

	for (const line of lines) {
		// Match ATX-style headings (# Heading)
		const match = line.match(/^(#{1,6})\s+(.+)$/);
		if (match) {
			const level = match[1]?.length ?? 0;
			const text = match[2]?.trim() ?? "";
			// Remove any trailing #s or special chars
			const cleanText = text.replace(/\s*#+\s*$/, "").trim();
			// Generate ID using the same slugify utility as the markdown renderer
			const id = slugify(cleanText);

			if (id && cleanText) {
				headings.push({ id, text: cleanText, level });
			}
		}
	}

	return headings;
}

export function OnThisPage({ markdown, className }: OnThisPageProps) {
	const { localization } = usePluginOverrides<
		BlogPluginOverrides,
		Partial<BlogPluginOverrides>
	>("blog", {
		localization: BLOG_LOCALIZATION,
	});
	const [activeId, setActiveId] = useState<string>("");
	const headings = useMemo(() => extractHeadings(markdown), [markdown]);

	useEffect(() => {
		if (headings.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				// Find the first heading that's in view
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setActiveId(entry.target.id);
						break;
					}
				}
			},
			{
				rootMargin: "-80px 0px -80% 0px",
				threshold: 0,
			},
		);

		// Observe all heading elements
		headings.forEach(({ id }) => {
			const element = document.getElementById(id);
			if (element) {
				observer.observe(element);
			}
		});

		return () => {
			observer.disconnect();
		};
	}, [headings]);

	if (headings.length === 0) {
		return null;
	}

	const handleClick = (id: string) => {
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	};

	return (
		<nav
			className={cn(
				"sticky top-24 z-30 ml-auto hidden xl:flex w-44 flex-col gap-2 overflow-hidden pb-8",
				className,
			)}
			aria-label="Table of contents"
		>
			<div className="overflow-y-auto px-2">
				<div className="flex flex-col gap-2 p-4 pt-0 text-sm">
					<p className="font-semibold text-muted-foreground sticky top-0 h-6 text-xs">
						{localization.BLOG_POST_ON_THIS_PAGE}
					</p>
					{headings.map(({ id, text, level }) => {
						const paddingLeft =
							level === 1
								? "0"
								: level === 2
									? "0.5rem"
									: level === 3
										? "1rem"
										: level === 4
											? "1.5rem"
											: level === 5
												? "2rem"
												: level === 6
													? "2.5rem"
													: "0";
						return (
							<a
								key={id}
								href={`#${id}`}
								onClick={(e) => {
									e.preventDefault();
									handleClick(id);
								}}
								style={{ paddingLeft }}
								className={cn(
									"text-muted-foreground hover:text-foreground text-[0.8rem] no-underline transition-colors",
									activeId === id && "text-foreground",
								)}
								data-active={activeId === id}
								data-depth={level}
							>
								{text}
							</a>
						);
					})}
				</div>
			</div>
		</nav>
	);
}
