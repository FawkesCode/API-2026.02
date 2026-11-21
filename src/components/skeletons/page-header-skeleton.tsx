import { cn } from "cn";
import { Skeleton } from "../ui/skeleton";

function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className="flex  w-full border-b-2 border-gray-200 pb-4 mb-13">
      <Skeleton className={cn("w-35 h-6 rounded-full", className)} />
    </div>
  );
}

export default PageHeaderSkeleton;
