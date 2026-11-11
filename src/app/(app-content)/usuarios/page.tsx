import { Suspense } from "react";
import { notFound } from "next/navigation";
import { UsuarioFormDialog } from "@/components/usuarios/usuario-form-dialog";
import UsuariosFilter from "@/components/usuarios/usuarios-filter";
import UsuariosTable from "@/components/usuarios/usuarios-table";
import { podeVerUsuarios } from "@/lib/access-control";
import { getUsuarioAtual } from "@/lib/data/sessao";
import { getUsuarios } from "@/lib/data/usuarios";
import { parseFiltrosUsuario } from "@/schemas/usuario-filtros.schema";
import PageHeader from "@/components/page-header";
import DefaultPagination from "@/components/default-pagination";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const usuario = await getUsuarioAtual();
  if (!podeVerUsuarios(usuario?.cargo)) notFound();

  const filtros = parseFiltrosUsuario(await searchParams);
  const { itens, total, pagina, totalPaginas, itensPorPagina } =
    await getUsuarios(filtros);

  return (
    <div className="flex flex-col">
      <PageHeader other={<UsuarioFormDialog />}>Gerenciar Usuários</PageHeader>

      {/* useSearchParams no filtro exige Suspense para o build estático. */}
      <Suspense
        key={JSON.stringify(searchParams)}
        fallback={
          <p className="text-sm text-muted-foreground">Carregando usuários…</p>
        }
      >
        <UsuariosFilter />
      </Suspense>

      <section className="rounded-xl border mt-6 bg-white p-4 mb-8">
        <UsuariosTable usuarios={itens} />
        <DefaultPagination
          page={pagina}
          totalPages={totalPaginas}
          total={total}
          itensPerPage={itensPorPagina}
        />
      </section>
    </div>
  );
}
