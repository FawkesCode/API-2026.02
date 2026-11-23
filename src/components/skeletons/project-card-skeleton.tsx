import { Card, CardContent, CardFooter, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

function ProjectCardSkeleton() {
  return (
    <Card className="px-8 flex flex-col gap-12">
      <CardTitle className="flex flex-col gap-2">
        <Skeleton className="h-3 w-[80%] rounded-full" />
        <Skeleton className="h-6 w-30 rounded-full" />
        <Skeleton className="h-4 w-[80%] rounded-full" />
      </CardTitle>
      <CardContent className="px-0">
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-3 w-[60%] rounded-full" />
      </CardContent>
      <CardFooter className="px-0 flex justify-between">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="h-3 w-20 rounded-full" />
      </CardFooter>
    </Card>
  );
}

export default ProjectCardSkeleton;
