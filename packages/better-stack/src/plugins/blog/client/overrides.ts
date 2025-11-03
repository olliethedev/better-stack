import type { SerializedPost } from "../types";
import type { ComponentType, ReactNode } from "react";
import type { BlogLocalization } from "./localization";

/**
 * Overridable components and functions for the Todos plugin
 *
 * External consumers can provide their own implementations of these
 * to customize the behavior for their framework (Next.js, React Router, etc.)
 */
export interface BlogPluginOverrides {
	Link?: ComponentType<{
		href: string;
		children: ReactNode;
		className?: string;
	}>;
	PostCard?: ComponentType<{
		post: SerializedPost;
	}>;
	/**
	 * Navigation function for programmatic navigation
	 */
	navigate: (path: string) => void | Promise<void>;
	/**
	 * Refresh function to invalidate server-side cache (e.g., Next.js router.refresh())
	 */
	refresh?: () => void | Promise<void>;
	/**
	 * Image component for displaying images
	 */
	Image?: ComponentType<{
		src: string;
		alt: string;
		className?: string;
		width?: number | string;
		height?: number | string;
	}>;
	/**
	 * Function used to upload an image and return its URL.
	 */
	uploadImage: (file: File) => Promise<string>;
	/**
	 * Localization object for the blog plugin
	 */
	localization?: BlogLocalization;
	/**
	 * API base URL
	 */
	apiBaseURL: string;
	/**
	 * API base path
	 */
	apiBasePath: string;
	/**
	 * Whether to show the attribution
	 */
	showAttribution?: boolean;
}
