import PageHeader from "@/components/page-header";
import { MensagensLogView } from "@/components/mensagens-log/mensagens-log-view";
import { podeCadastrarMensagensLog } from "@/lib/access-control";
import { getUsuarioAtual } from "@/lib/data/sessao";
import { connection } from "next/server";
import { notFound } from "next/navigation";

export default async function MensagensLogPage() {
  // Depende do usuário da requisição: não pode ser renderizada no build.
  await connection();

  const usuario = await getUsuarioAtual();
  if (!podeCadastrarMensagensLog(usuario?.cargo)) notFound();

  return (
    <>
      <PageHeader>Mensagens de Log</PageHeader>
      <MensagensLogView />
    </>
  );
}
