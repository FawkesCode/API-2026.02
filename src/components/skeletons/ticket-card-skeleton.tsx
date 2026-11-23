import { Card, CardContent, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

function TicketCardSkeleton() {
  return (
    <Card className="px-8">
      <CardTitle className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded-xl" />
          <Skeleton className="h-4 w-[40%] rounded-full" />
        </div>
        <Skeleton className="h-3 w-[30%] rounded-full" />
        <div className="flex justify-between">
          <div className="flex gap-3 items-center">
            <Skeleton className="h-2 w-30 rounded-full" />
            <Skeleton className="h-2 w-30 rounded-full" />
          </div>
          <div className="flex gap-3 items-center">
            <Skeleton className="h-2 w-30 rounded-full" />
            <Skeleton className="h-3 w-30 rounded-full" />
          </div>
        </div>
      </CardTitle>
      <div className="w-full border-b border-b-muted"></div>
      <CardContent className="px-0 pb-8 pt-3 flex flex-col gap-6">
        <Skeleton className="h-2 w-[60%] rounded-full" />
        <Skeleton className="h-15 w-full rounded-xl" />
      </CardContent>
    </Card>
  );
}

export default TicketCardSkeleton;
