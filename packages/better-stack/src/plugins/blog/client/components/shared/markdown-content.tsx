"use client";
import { cn } from "../../../utils";
import {
	createElement,
	isValidElement,
	useMemo,
	useRef,
	useState,
} from "react";
import type {
	ComponentPropsWithoutRef,
	MouseEventHandler,
	ReactNode,
} from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "../shared/markdown-content-styles.css";
import "../forms/markdown-editor-styles.css";
import "highlight.js/styles/panda-syntax-light.css";
import { slugify } from "../../../utils";
import { CopyIcon } from "lucide-react";
import { CheckIcon } from "lucide-react";
import { usePluginOverrides } from "@btst/stack/context";
import type { BlogPluginOverrides } from "../../overrides";
import { DefaultImage, DefaultLink } from "./defaults";

export type MarkdownContentProps = {
	markdown: string;
	className?: string;
};

function getNodeText(node: ReactNode): string {
	if (node == null) return "";
	if (typeof node === "string" || typeof node === "number") return String(node);
	if (Array.isArray(node)) return node.map(getNodeText).join("");
	if (isValidElement(node)) {
		const props = node.props as Record<string, unknown>;
		return getNodeText(props.children as ReactNode);
	}
	return "";
}

function isCheckboxElement(
	node: ReactNode,
): node is ReturnType<typeof createElement> {
	return (
		isValidElement(node) &&
		(node.type as unknown) === "input" &&
		(node.props as { type?: string }).type === "checkbox"
	);
}

function createTaskListItemRenderer() {
	return function LiRenderer(
		props: React.LiHTMLAttributes<HTMLLIElement> & { children?: ReactNode },
	) {
		const { className, children, ...rest } = props;
		const isTaskItem = (className ?? "").split(" ").includes("task-list-item");
		if (!isTaskItem) {
			return (
				<li className={className} {...rest}>
					{children}
				</li>
			);
		}

		const childArray = Array.isArray(children) ? children : [children];
		const checkboxNode = childArray.find(isCheckboxElement);
		const nonCheckboxChildren = childArray.filter((c) => !isCheckboxElement(c));

		const labelText = getNodeText(nonCheckboxChildren as unknown as ReactNode);
		const baseId = slugify(labelText || "task-item");
		const uniqueId = `${baseId}-${Math.random().toString(36).slice(2, 8)}`;

		return (
			<li className={className} {...rest}>
				{checkboxNode
					? createElement(checkboxNode.type, {
							...checkboxNode.props,
							id: uniqueId,
							"aria-label": labelText || "Task item",
						})
					: null}
				<label htmlFor={uniqueId}>
					{nonCheckboxChildren as unknown as ReactNode}
				</label>
			</li>
		);
	};
}

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
function createHeadingRenderer<T extends HeadingTag>(tag: T) {
	return function HeadingRenderer(props: ComponentPropsWithoutRef<T>) {
		const { children, ...rest } = props as { children: ReactNode };
		const text = getNodeText(children);
		const id = slugify(text);
		return createElement(
			tag,
			{ id, ...(rest as object) },
			children,
			text ? (
				<a
					className="heading-anchor"
					href={`#${id}`}
					aria-label="Link to heading"
				>
					#
				</a>
			) : null,
		);
	};
}

function AnchorRenderer(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
	const { Link } = usePluginOverrides<
		BlogPluginOverrides,
		Partial<BlogPluginOverrides>
	>("blog", {
		Link: DefaultLink,
	});
	const { href = "", children, className: anchorClassName, ...rest } = props;

	return (
		<Link href={href} className={anchorClassName as string} {...rest}>
			{children}
		</Link>
	);
}

function ImgRenderer(props: React.ImgHTMLAttributes<HTMLImageElement>) {
	const { Image } = usePluginOverrides<
		BlogPluginOverrides,
		Partial<BlogPluginOverrides>
	>("blog", {
		Image: DefaultImage,
	});
	const {
		src = "",
		alt = "",
		className: imgClassName,
		width,
		height,
		...rest
	} = props;
	return (
		<Image
			src={src}
			alt={alt}
			className={imgClassName as string}
			width={width as number}
			height={height as number}
			{...rest}
		/>
	);
}

type CodeProps = React.HTMLAttributes<HTMLElement> & {
	inline?: boolean;
	node?: unknown;
};
function CodeRenderer({ inline, className, children, ...rest }: CodeProps) {
	const hasLanguage = /language-([a-z0-9-]+)/i.test(className ?? "");
	const isInline = inline ?? !hasLanguage;
	if (isInline) {
		return (
			<code className={className} {...rest}>
				{children}
			</code>
		);
	}
	// Block code: keep markup simple here; the <pre> wrapper will handle toolbar/copier
	return (
		<code className={className} {...rest}>
			{children}
		</code>
	);
}

function PreRenderer(props: React.HTMLAttributes<HTMLPreElement>) {
	const { children, ...rest } = props;
	const child = Array.isArray(children) ? children[0] : children;
	let language: string | undefined;
	if (isValidElement(child)) {
		const className = (child.props as { className?: string }).className;
		const match = /language-([a-z0-9-]+)/i.exec(className ?? "");
		language = match?.[1];
	}
	const label = (language ?? "text").toUpperCase();

	const preRef = useRef<HTMLPreElement | null>(null);
	const [copied, setCopied] = useState(false);
	const resetTimerRef = useRef<number | null>(null);

	// Prepare line numbers based on code text
	let codeText = "";
	if (isValidElement(child)) {
		const childProps = child.props as { children?: ReactNode };
		codeText = getNodeText(childProps.children as ReactNode);
	}
	const normalized = codeText.endsWith("\n") ? codeText.slice(0, -1) : codeText;
	const lineCount = Math.max(1, normalized.split("\n").length);
	const digitCount = String(lineCount).length;
	const onCopy: MouseEventHandler<HTMLButtonElement> = async (e) => {
		e.preventDefault();
		e.stopPropagation();
		try {
			const text = preRef.current?.textContent ?? "";
			if (
				text &&
				typeof navigator !== "undefined" &&
				navigator.clipboard?.writeText
			) {
				await navigator.clipboard.writeText(text);
				setCopied(true);
				if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
				resetTimerRef.current = window.setTimeout(() => {
					setCopied(false);
					resetTimerRef.current = null;
				}, 2000);
			}
		} catch {}
	};
	return (
		<div
			className="milkdown-code-block"
			style={{
				["--code-gutter-width" as unknown as string]: `${digitCount + 1}ch`,
			}}
		>
			<div className="code-toolbar">
				<span className="language-label">{label}</span>
				<button
					type="button"
					className="copy-button"
					onClick={onCopy}
					aria-label={copied ? "Copied" : "Copy code"}
				>
					{copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
				</button>
			</div>
			<div className="code-content">
				<ol className="line-numbers" aria-hidden>
					{Array.from({ length: lineCount }).map((_, idx) => (
						<li key={idx + 1}>{idx + 1}</li>
					))}
				</ol>
				<pre ref={preRef} {...rest}>
					{children}
				</pre>
			</div>
		</div>
	);
}

export function MarkdownContent({ markdown, className }: MarkdownContentProps) {
	const components = useMemo<Components>(() => {
		return {
			a: AnchorRenderer,
			img: ImgRenderer,
			code: CodeRenderer,
			pre: PreRenderer,
			h1: createHeadingRenderer("h1"),
			h2: createHeadingRenderer("h2"),
			h3: createHeadingRenderer("h3"),
			h4: createHeadingRenderer("h4"),
			h5: createHeadingRenderer("h5"),
			h6: createHeadingRenderer("h6"),
			li: createTaskListItemRenderer(),
		};
	}, []);

	return (
		<div className={cn("milkdown-custom", className)}>
			<div className="milkdown">
				<div className="milkdown-content">
					<ReactMarkdown
						remarkPlugins={[remarkGfm, remarkMath] as never}
						rehypePlugins={[rehypeHighlight, rehypeKatex] as never}
						components={components as never}
					>
						{markdown}
					</ReactMarkdown>
				</div>
			</div>
		</div>
	);
}
