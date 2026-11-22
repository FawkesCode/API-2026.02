import { Card, CardContent, CardFooter } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import PaginationSkeleton from "./pagination-skeleton";

function UserTableSkeleton() {
  return (
    <Card className="px-8">
      <CardContent className="px-0 pb-4">
        <div role="table" className="w-full">
          <div role="row" className="flex items-center border-b px-2 pb-3">
            <div
              className={`grid grid-cols-[2fr_1.3fr_1.6fr_1fr] flex-1 text-sm font-medium`}
            >
              <span role="columnheader" className="text-gray-400">
                <Skeleton className="h-4 w-40 rounded-full" />
              </span>
              <span
                role="columnheader"
                className="text-center text-gray-400 items-center flex justify-center"
              >
                <Skeleton className="h-4 w-40 rounded-full" />
              </span>
              <span
                role="columnheader"
                className="text-center text-gray-400 flex justify-center"
              >
                <Skeleton className="h-4 w-40 rounded-full" />
              </span>
              <span
                role="columnheader"
                className="text-center text-gray-400 flex justify-center"
              >
                <Skeleton className="h-4 w-40 rounded-full" />
              </span>
            </div>
            <div className="w-8" />
          </div>

          <div className="divide-y">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                role="row"
                className="flex items-center px-2 py-4"
              >
                <div
                  className={`grid grid-cols-[2fr_1.3fr_1.6fr_1fr]  gap-2 flex-1 items-center`}
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-32 rounded-full" />
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Skeleton className="h-4 w-24 rounded-full" />
                  </div>
                  <div className="flex justify-center">
                    <Skeleton className="h-6 w-28 rounded-full" />
                  </div>
                  <div className="flex justify-center">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </div>

                <div className="flex w-8 justify-end">
                  <Skeleton className="h-5 w-5 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-0">
        <PaginationSkeleton className="pb-0" />
      </CardFooter>
    </Card>
  );
}

export default UserTableSkeleton;
