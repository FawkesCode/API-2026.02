import FilterSkeleton from "@/components/skeletons/filter-skeleton";
import PaginationSkeleton from "@/components/skeletons/pagination-skeleton";
import UserTableSkeleton from "@/components/skeletons/user-table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <div className="flex justify-between items-center w-full border-b-2 border-gray-200 pb-4 mb-13">
        <Skeleton className="w-35 h-6 rounded-full" />
        <Skeleton className="h-5 w-40 rounded-full" />
      </div>

      <div className="flex flex-col h-full justify-between pb-8">
        <section className="flex flex-col gap-8 pb-8">
          <FilterSkeleton />

          <UserTableSkeleton />
        </section>

        <PaginationSkeleton />
      </div>
    </>
  );
}
