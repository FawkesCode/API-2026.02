import { Card, CardContent, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

function FilterSkeleton() {
  return (
    <Card className="px-8 overflow-visible">
      <CardTitle className="relative">
        <Skeleton className="h-5 w-20 rounded-full absolute -top-8" />
      </CardTitle>
      <CardContent className="px-0 flex gap-3 flex-row">
        <Skeleton className="h-6 w-[25%] rounded-full " />
        <Skeleton className="h-6 w-[25%] rounded-full " />
        <Skeleton className="h-6 w-[25%] rounded-full " />
        <Skeleton className="h-6 w-[25%] rounded-full " />
      </CardContent>
    </Card>
  );
}

export default FilterSkeleton;
