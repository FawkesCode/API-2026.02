import PageHeaderSkeleton from "@/components/skeletons/page-header-skeleton";
import TicketLogsSkeleton from "@/components/skeletons/ticket-logs-skeleton";

function Loading() {
  return (
    <>
      <PageHeaderSkeleton className="w-[60%]" />
      <TicketLogsSkeleton className="mt-0" />;
    </>
  );
}

export default Loading;
