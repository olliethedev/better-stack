import { cn } from "../../../utils";

export function PageLayout({
	children,
	className,
	"data-testid": dataTestId,
}: {
	children: React.ReactNode;
	className?: string;
	"data-testid"?: string;
}) {
	return (
		<div
			className={cn(
				"container mx-auto flex min-h-dvh flex-col items-center gap-16 px-4 py-24 lg:px-16",
				className,
			)}
			data-testid={dataTestId}
		>
			{children}
		</div>
	);
}
