export function BetterBlogAttribution() {
	return (
		<div className="w-full text-center">
			<p className="flex items-center justify-center gap-1 py-2 text-gray-500 text-sm">
				Powered by{" "}
				<a
					className="flex items-center gap-1 font-semibold underline"
					href="https://www.better-blog.com/"
					target="_blank"
					rel="noreferrer noopener"
					aria-label="Better Blog — open-source React blog framework"
					title="Better Blog — open-source React blog framework"
				>
					<span className="cursor-pointer">better-blog</span>
				</a>
			</p>
		</div>
	);
}
