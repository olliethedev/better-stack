import { Skeleton } from "../ui/skeleton";

export function PageHeaderSkeleton() {
	return (
		<div className="flex max-w-[600px] flex-col items-center gap-2">
			<Skeleton className="h-12 w-56" />
			<Skeleton className="h-4 w-80" />
		</div>
	);
}
