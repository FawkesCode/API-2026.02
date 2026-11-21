import { Skeleton } from "../ui/skeleton";

function PageHeaderSkeleton() {
  return (
    <div className="flex  w-full border-b-2 border-gray-200 pb-4 mb-13">
      <Skeleton className="w-35 h-6 rounded-full" />
    </div>
  );
}

export default PageHeaderSkeleton;
