import FilterSkeleton from "@/components/skeletons/filter-skeleton";
import PageHeaderSkeleton from "@/components/skeletons/page-header-skeleton";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="mb-8">
        <FilterSkeleton />
      </div>
      <section className="flex flex-col gap-6 ">
        <div className="flex flex-col gap-6">
          <section className="flex gap-4 flex-col 2xl:flex-row">
            <div className="flex flex-col w-full lg:grid lg:grid-cols-2 gap-3 shrink-0 2xl:w-auto 2xl:min-w-[60%]">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card
                  key={index}
                  className="p-6 flex flex-col justify-between gap-4"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-9 w-9 rounded-lg" />
                  </div>
                  <div className="flex items-end justify-between">
                    <Skeleton className="h-9 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </Card>
              ))}
            </div>

            <Card className="xl:flex-1 flex flex-col gap-2 pt-4 min-h-75 xl:min-h-50">
              <CardTitle className="px-6">
                <Skeleton className="h-5 w-44" />
                <div className="my-2 h-px w-full bg-muted" />
              </CardTitle>

              <CardContent className="flex-1 flex flex-col justify-around py-4 gap-3">
                {["w-[55%]", "w-[35%]", "w-[45%]", "w-[80%]"].map(
                  (width, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-3.5 w-12 shrink-0" />
                      <Skeleton className={`h-6 ${width} rounded-md`} />
                    </div>
                  ),
                )}
              </CardContent>
            </Card>
          </section>

          <section className="flex gap-4 flex-col lg:flex-wrap lg:flex-row 2xl:flex-row">
            <Card className="w-full lg:min-w-120 lg:w-120 flex-1 flex flex-col gap-4 pt-4">
              <CardTitle className="px-6">
                <Skeleton className="h-5 w-52" />
                <div className="my-2 h-px w-full bg-muted" />
              </CardTitle>

              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-14 w-20 rounded-lg" />
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-16" />
                    <Skeleton className="h-3.5 w-14" />
                  </div>
                </div>

                <div className="flex items-end justify-around gap-3 h-44 pt-4 px-2">
                  {["h-[65%]", "h-[90%]", "h-[45%]", "h-[75%]", "h-[55%]"].map(
                    (height, i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center gap-2 flex-1 h-full justify-end"
                      >
                        <Skeleton
                          className={`w-full max-w-10 ${height} rounded-t-md`}
                        />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="justify-between lg:w-[50%] lg:ml-2 2xl:w-auto flex flex-col gap-4 pt-4">
              <CardTitle className="px-6">
                <Skeleton className="h-5 w-36" />
                <div className="my-2 h-px w-full bg-muted" />
              </CardTitle>

              <CardContent className="flex flex-col items-center justify-center gap-6 py-4 flex-1">
                <Skeleton className="h-40 w-40 rounded-full" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="lg:w-[45%] 2xl:w-auto flex flex-col gap-4 pt-4">
              <CardTitle className="px-6">
                <Skeleton className="h-5 w-40" />
                <div className="my-2 h-px w-full bg-muted" />
              </CardTitle>

              <CardContent className="flex flex-col items-center justify-center gap-6 py-4 flex-1">
                <Skeleton className="h-40 w-40 rounded-full" />
                <div className="flex flex-wrap justify-center gap-3">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="pb-8">
            <Card className="w-full 2xl:w-[50%] flex flex-col gap-4 pt-4">
              <CardTitle className="px-6">
                <Skeleton className="h-5 w-56" />
                <div className="my-2 h-px w-full bg-muted" />
              </CardTitle>

              <CardContent className="flex flex-col gap-4 py-4">
                <Skeleton className="h-52 w-full rounded-lg" />
                <div className="flex justify-center gap-6">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </section>
    </>
  );
}
