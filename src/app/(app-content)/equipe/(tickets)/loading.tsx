import PaginationSkeleton from "@/components/skeletons/pagination-skeleton";
import TicketCardSkeleton from "@/components/skeletons/ticket-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <div className="flex flex-col">
        <div className="w-full border-b-2 border-gray-200 pb-4 mb-6 flex justify-between items-center">
          <Skeleton className="w-60 h-6 rounded-full " />
          <Skeleton className="w-9 h-9 rounded-xl " />
        </div>
        <Skeleton className="w-[40%] h-4 rounded-full mb-13" />
      </div>

      <div className="flex flex-col h-full justify-between pb-8">
        <section className="flex flex-col gap-4 pb-8">
          {Array.from({ length: 5 }).map((_, index) => (
            <TicketCardSkeleton key={index} />
          ))}
        </section>

        <PaginationSkeleton />
      </div>
    </>
  );
}
