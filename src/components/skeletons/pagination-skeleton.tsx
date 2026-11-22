import { cn } from "cn";
import { Skeleton } from "../ui/skeleton";

function PaginationSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("w-full flex justify-between px-4 pb-8", className)}>
      <div className="flex  gap-6">
        <Skeleton className="h-3 w-50 rounded-full" />
        <Skeleton className="h-3 w-50 rounded-full" />
      </div>
      <div className="flex  gap-4">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-3 w-25 rounded-full" />
        <Skeleton className="h-3 w-25 rounded-full" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
    </div>
  );
}

export default PaginationSkeleton;
