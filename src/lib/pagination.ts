export const PAGE_SIZES = [5, 10, 20, 50];
export const STANDARD_PAGE_SIZE = 5;

export function normalizedPagination(
  page?: number | string,
  itensPerPage?: number | string,
) {
  const size = Number(itensPerPage);
  return {
    pagina: Math.max(1, Math.floor(Number(page)) || 1),
    itensPorPagina: PAGE_SIZES.includes(size) ? size : STANDARD_PAGE_SIZE,
  };
}
