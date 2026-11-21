import FilterSkeleton from "@/components/skeletons/filter-skeleton";
import PageHeaderSkeleton from "@/components/skeletons/page-header-skeleton";
import PaginationSkeleton from "@/components/skeletons/pagination-skeleton";
import TicketCardSkeleton from "@/components/skeletons/ticket-card-skeleton";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />

      <div className="flex flex-col h-full justify-between pb-8">
        <section className="flex flex-col gap-4 pb-8">
          <FilterSkeleton />

          {Array.from({ length: 5 }).map((_, index) => (
            <TicketCardSkeleton key={index} />
          ))}
        </section>

        <PaginationSkeleton />
      </div>
    </>
  );
}
