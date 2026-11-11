export const PAGINATION_CONFIGS = {
  default: { sizes: [5, 10, 20, 50], defaultSize: 5 },
  projects: { sizes: [8, 16, 24, 48], defaultSize: 8 },
} as const;

export type PaginationConfig = {
  sizes: readonly number[];
  defaultSize: number;
};

export function normalizedPagination(
  page?: number | string,
  itensPerPage?: number | string,
  config: PaginationConfig = PAGINATION_CONFIGS.default,
) {
  const size = Number(itensPerPage);

  return {
    pagina: Math.max(1, Math.floor(Number(page)) || 1),
    itensPorPagina: config.sizes.includes(size) ? size : config.defaultSize,
  };
}
