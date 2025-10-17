export function PageHeader({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<div
			className="flex max-w-[600px] flex-col items-center gap-4 text-center"
			data-testid="page-header"
		>
			<h1
				className="font-medium font-sans text-6xl tracking-tight"
				data-testid="page-title"
			>
				{title}
			</h1>
			<p className="text-muted-foreground" data-testid="page-description">
				{description}
			</p>
		</div>
	);
}
