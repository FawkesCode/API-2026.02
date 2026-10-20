import { Suspense } from "react";
import { notFound } from "next/navigation";
import { UsuarioFormDialog } from "@/components/usuarios/usuario-form-dialog";
import UsuariosFilter from "@/components/usuarios/usuarios-filter";
import UsuariosPagination from "@/components/usuarios/usuarios-pagination";
import UsuariosTable from "@/components/usuarios/usuarios-table";
import { podeVerUsuarios } from "@/lib/access-control";
import { getUsuarioAtual } from "@/lib/data/sessao";
import { getUsuarios } from "@/lib/data/usuarios";
import { parseFiltrosUsuario } from "@/schemas/usuario-filtros.schema";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const usuario = await getUsuarioAtual();
  if (!podeVerUsuarios(usuario?.cargo)) notFound();

  const filtros = parseFiltrosUsuario(await searchParams);
  const { itens, total, pagina, totalPaginas } = await getUsuarios(filtros);

  // Mantém os filtros ativos ao trocar de página.
  function hrefDaPagina(destino: number) {
    const params = new URLSearchParams();
    const { pagina: _ignorada, ...restantes } = filtros;
    Object.entries(restantes).forEach(([chave, valor]) => {
      if (valor) params.set(chave, String(valor));
    });
    if (destino > 1) params.set("pagina", String(destino));
    const query = params.toString();
    return query ? `/usuarios?${query}` : "/usuarios";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-blue-900 pb-3">
        <h1 className="text-3xl font-semibold italic text-card-foreground">
          Gerenciar Usuários
        </h1>
        <UsuarioFormDialog />
      </div>

      {/* useSearchParams no filtro exige Suspense para o build estático. */}
      <Suspense fallback={null}>
        <UsuariosFilter />
      </Suspense>

      <section className="rounded-xl border bg-white p-4">
        <UsuariosTable usuarios={itens} />
        <UsuariosPagination
          pagina={pagina}
          totalPaginas={totalPaginas}
          total={total}
          exibidos={itens.length}
          hrefDaPagina={hrefDaPagina}
        />
      </section>
    </div>
  );
}