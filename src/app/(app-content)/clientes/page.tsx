import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ClientesView } from "@/components/clientes/clientes-view";
import PageHeader from "@/components/page-header";
import { podeGerenciarClientes } from "@/lib/access-control";
import { getUsuarioAtual } from "@/lib/data/sessao";

export default async function ClientesPage() {
  await connection();
  const usuario = await getUsuarioAtual();
  if (!podeGerenciarClientes(usuario?.cargo)) notFound();

  return (
    <>
      <PageHeader>Clientes</PageHeader>
      <ClientesView />
    </>
  );
}
