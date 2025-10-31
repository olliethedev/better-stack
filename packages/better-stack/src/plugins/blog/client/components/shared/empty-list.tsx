import { NotebookTextIcon } from "lucide-react";

export function EmptyList({ message }: { message: string }) {
	return (
		<div
			className="flex min-h-[600px] flex-col items-center justify-center gap-10 text-center text-muted-foreground"
			data-testid="empty-state"
		>
			<NotebookTextIcon className="size-[100px]" />
			<p className="font-bold text-2xl" data-testid="empty-message">
				{message}
			</p>
		</div>
	);
}
