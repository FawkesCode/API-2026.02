"use client";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { cn } from "cn";

interface PaginationProps {
  pageOptions?: number[];
  page: number;
  totalPages: number;
  total: number;
  shown?: number;
  itensPerPage: number;
}

function getPageNumbers(page: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) pages.push("ellipsis-start");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("ellipsis-end");

  pages.push(totalPages);
  return pages;
}

export default function DefaultPagination({
  pageOptions,
  page,
  totalPages,
  itensPerPage,
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  function buildHref(newPage: number, newPageSize?: number) {
    const params = new URLSearchParams(searchParams.toString());

    if (newPage > 1) params.set("pagina", String(newPage));
    else params.delete("pagina");

    params.set("itensPorPagina", String(newPageSize ?? itensPerPage));

    const query = params.toString();

    return query ? `${pathname}?${query}` : pathname;
  }

  function handlePageSizeChange(value: string | null) {
    if (!value) return;
    router.push(buildHref(1, Number(value)));
  }

  const pageSizeOptions = pageOptions ? pageOptions : [5, 10, 20, 50];
  const currentPage = page;

  return (
    <div className="flex w-full justify-between items-center text-xs font-medium   p-3 pl-6 pr-6 rounded-xl">
      <div className="flex gap-1 items-center">
        <p>
          Mostrando página{" "}
          <span className="mr-1 ml-1 border border-muted p-4 rounded-xl max-w-3 max-h-3 inline-flex items-center justify-center">
            {currentPage}
          </span>{" "}
          de {totalPages} <span className="text-gray-200 ml-2 mr-2">|</span>
        </p>
        <p className="flex-1 mr-2">Itens por página</p>
        <Select
          value={String(itensPerPage)}
          onValueChange={handlePageSizeChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectGroup>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              className={cn("text-xs", {
                "text-muted-foreground pointer-events-none": !hasPrev,
              })}
              href={hasPrev ? buildHref(page - 1) : undefined}
              aria-disabled={!hasPrev}
            />
          </PaginationItem>

          {getPageNumbers(page, totalPages).map((p) =>
            typeof p === "number" ? (
              <PaginationItem key={p}>
                <PaginationLink
                  className="text-xs"
                  href={buildHref(p)}
                  isActive={p === page}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationEllipsis />
              </PaginationItem>
            ),
          )}

          <PaginationItem>
            <PaginationNext
              className={cn("text-xs", {
                "text-muted-foreground pointer-events-none": !hasNext,
              })}
              href={hasNext ? buildHref(page + 1) : undefined}
              aria-disabled={!hasNext}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
