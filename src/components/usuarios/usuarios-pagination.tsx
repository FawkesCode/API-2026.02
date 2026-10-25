import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface UsuariosPaginationProps {
  pagina: number;
  totalPaginas: number;
  total: number;
  exibidos: number;
  hrefDaPagina: (pagina: number) => string;
}

function Controle({
  href,
  label,
  children,
}: {
  href?: string;
  label: string;
  children: React.ReactNode;
}) {
  if (!href) {
    return (
      <span aria-disabled className="p-1 text-slate-300">
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className="p-1 hover:text-foreground">
      {children}
    </Link>
  );
}

export default function UsuariosPagination({
  pagina,
  totalPaginas,
  total,
  exibidos,
  hrefDaPagina,
}: UsuariosPaginationProps) {
  const temAnterior = pagina > 1;
  const temProxima = pagina < totalPaginas;

  return (
    <nav
      aria-label="Paginação"
      className="flex items-center justify-center gap-2 pt-4 text-xs text-gray-400"
    >
      <Controle
        href={temAnterior ? hrefDaPagina(1) : undefined}
        label="Primeira página"
      >
        <ChevronsLeft className="size-3.5" />
      </Controle>
      <Controle
        href={temAnterior ? hrefDaPagina(pagina - 1) : undefined}
        label="Página anterior"
      >
        <ChevronLeft className="size-3.5" />
      </Controle>
      <span>
        Mostrando {exibidos} usuários de {total}
      </span>
      <Controle
        href={temProxima ? hrefDaPagina(pagina + 1) : undefined}
        label="Próxima página"
      >
        <ChevronRight className="size-3.5" />
      </Controle>
      <Controle
        href={temProxima ? hrefDaPagina(totalPaginas) : undefined}
        label="Última página"
      >
        <ChevronsRight className="size-3.5" />
      </Controle>
    </nav>
  );
}
