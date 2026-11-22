import PageHeaderSkeleton from "@/components/skeletons/page-header-skeleton";
import ProjectCardSkeleton from "@/components/skeletons/project-card-skeleton";
import PaginationSkeleton from "@/components/skeletons/pagination-skeleton";

function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="flex flex-col justify-between h-full ">
        <section className="grid grid-cols-1 md:grid-cols-2  xl:grid-cols-4  gap-4 pb-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProjectCardSkeleton key={index} />
          ))}
        </section>
        <PaginationSkeleton />
      </div>
    </>
  );
}

export default Loading;
