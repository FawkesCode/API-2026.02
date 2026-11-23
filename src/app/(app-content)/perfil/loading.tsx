import PageHeaderSkeleton from "@/components/skeletons/page-header-skeleton";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function Loading() {
  return (
    <>
      <PageHeaderSkeleton />

      <Card className="pb-10">
        <CardTitle className="flex gap-3 pr-8 pl-8">
          <Skeleton className="w-22 h-22 rounded-full" />
          <div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-60 rounded-full" />

              <Skeleton className="h-6 w-30 rounded-full" />
            </div>
            <Skeleton className="h-3 w-50 rounded-full mt-2" />
            <div className="flex text-[14px] mt-5 gap-2 text-muted-foreground items-center">
              <Skeleton className="h-3 w-70 rounded-full " />
              <Skeleton className="h-3 w-20 rounded-full" />
            </div>
          </div>
        </CardTitle>
        <div className="border-b border-muted"></div>
        <CardDescription className="pr-8 pl-8 flex gap-4 flex-col">
          <Skeleton className="h-4 w-60 rounded-full " />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton className="h-10 rounded-xl w-full" key={index} />
            ))}
          </div>
        </CardDescription>
      </Card>
    </>
  );
}

export default Loading;
