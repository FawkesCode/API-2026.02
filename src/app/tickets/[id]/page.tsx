import PageHeader from "@/components/page-header";
import { LogState } from "@/components/tickets/log-states";
import UserMessages from "@/components/tickets/user-messages";

export default async function LogsTicket({
  params,
}: PageProps<"/tickets/[id]">) {
  const { id } = await params;
  return (
    <>
      <PageHeader>
        Nome Projeto: [COD] {">"} ticket # {id}{" "}
      </PageHeader>
      <h1>{id}</h1>

      <h2>Componente de ticket montado:</h2>
      <LogState
        titulo={"Titulo de verdade"}
        descricao={"oi"}
        criadoEm={"2026-6-7"}
        status="iniciado"
      />
      <LogState
        titulo={"Titulo de verdade"}
        descricao={"oi"}
        criadoEm={"2026-6-7"}
        status="solicitado"
      />
      <LogState
        titulo={"Titulo de verdade"}
        descricao={"oi"}
        criadoEm={"2026-6-7"}
        status="recusado"
      />
      <LogState
        titulo={"Titulo de verdade"}
        descricao={"oi"}
        criadoEm={"2026-6-7"}
        status="aprovado"
      />

      <UserMessages
        sector={"Sector"}
        team={"Team"}
        date={new Date()}
        title={"Title"}
        description={"Description"}
        userName={"User Name"}
      />
    </>
  );
}
