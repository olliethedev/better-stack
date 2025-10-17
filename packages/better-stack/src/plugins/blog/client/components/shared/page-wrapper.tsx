"use client";

import { BetterBlogAttribution } from "./better-blog-attribution";
import { PageLayout } from "./page-layout";

export function PageWrapper({
	children,
	className,
	testId,
}: {
	children: React.ReactNode;
	className?: string;
	testId?: string;
}) {
	const { showAttribution } = {
		showAttribution: true,
	};
	return (
		<>
			<PageLayout className={className} data-testid={testId}>
				{children}
			</PageLayout>

			{showAttribution && <BetterBlogAttribution />}
		</>
	);
}
