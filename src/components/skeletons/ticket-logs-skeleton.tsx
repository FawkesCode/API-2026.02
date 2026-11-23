import { cn } from "cn";
import { Skeleton } from "../ui/skeleton";

function TicketLogsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col pb-6 mt-6", className)}>
      <section className="shrink-0 rounded-t-xl border -mt-6 border-gray-200 bg-white p-6">
        <div className="flex justify-between">
          <h2 className="text-lg font-bold text-card-foreground">
            <Skeleton className="h-4 w-60 rounded-full" />
          </h2>
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-30 rounded-full" />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 ">
          <Skeleton className="h-3 w-30 rounded-full" />
          <Skeleton className="h-3 w-30 rounded-full" />
          <Skeleton className="h-3 w-30 rounded-full" />
        </div>
      </section>
      <div className="flex min-h-0 flex-1 flex-col">
        <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto scrollbar-none border-x border-gray-200 bg-slate-100 pt-6 rounded-b-md border-b">
          <div className="px-6 flex flex-col gap-4">
            <Skeleton className="h-3 w-45 rounded-full" />
            <Skeleton className="h-2 w-70 rounded-full" />

            <div className="mt-6 flex flex-col gap-4">
              <Skeleton className="h-25 w-[60%] rounded-xl" />
              <div className="w-full flex justify-end">
                <Skeleton className="h-25 w-[50%] rounded-xl mr-0" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 flex-1 border-t border-gray-200  bg-white p-6">
            <Skeleton className="h-5 w-75 rounded-full" />

            <Skeleton className="h-6 w-full rounded-full mb-6" />

            <Skeleton className="flex-1 w-full rounded-xl" />
            <div className="w-full flex justify-end">
              <Skeleton className="h-8 w-40 rounded-xl justify-self-end" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default TicketLogsSkeleton;
