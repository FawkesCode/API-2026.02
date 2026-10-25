import PageHeader from "@/components/page-header";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import UserLog from "@/components/usuarios/user-log";
import { getUsuarioLogado } from "@/lib/data/sessao";
import { buscarPerfilComAtividades } from "@/services/atividade-conta.service";
import { CARGO_UI } from "@/types/usuario";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UserRound } from "lucide-react";

async function page() {
  const user = await getUsuarioLogado();
  const userId = !user?.id ? "Sem id" : user.id;
  const logs = await buscarPerfilComAtividades(userId);
  const activities = logs?.atividades;

  function formatDate(iso: string | Date) {
    return format(new Date(iso), "dd 'de' MMM, yyyy", { locale: ptBR });
  }

  function formatFromDate(iso: string | Date) {
    return formatDistanceToNow(new Date(iso), {
      addSuffix: true,
      locale: ptBR,
    });
  }

  return (
    <>
      <PageHeader>Meu Perfil</PageHeader>
      <Card>
        <CardTitle className="flex gap-3 pr-8 pl-8">
          <div className="bg-muted rounded-full border border-[#BBC0E1] aspect-square flex items-center justify-center">
            <UserRound
              size={45}
              color="bg-muted-foreground"
              fill="#BBC0E1"
            ></UserRound>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">
                {user?.nome ? user.nome : "Nome do usuário"}
              </h2>
              <span
                style={{
                  backgroundColor: user?.cargo
                    ? CARGO_UI[user.cargo]?.cor
                    : "#FFFFFF",
                }}
                className=" text-white p-3 pt-1 pb-1 rounded-full text-xs"
              >
                {user?.cargo ? CARGO_UI[user.cargo]?.label : "Cargo"}
              </span>
            </div>
            <p className="text-muted-foreground text-[14px]">
              {user?.email ? user.email : "email@exemplo.com"}
            </p>
            <div className="flex text-[14px] mt-3 gap-2 text-muted-foreground">
              <p>{`Adicionado em ${user?.criadoEm && formatDate(user?.criadoEm)} (${user?.criadoEm && formatFromDate(user?.criadoEm)})`}</p>
              <span className="text-accent">
                • {user?.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>
        </CardTitle>
        <div className="border-b border-muted"></div>
        <CardDescription className="pr-8 pl-8 flex gap-4 flex-col">
          <h2 className="text-card-foreground font-medium">
            Histórico de atividade recente
          </h2>
          <div className="flex flex-col gap-2">
            {activities && activities.length > 0 ? (
              activities.map((l) => (
                <UserLog
                  key={l.id}
                  type={l.tipo}
                  desc={l.descricao}
                  createdAt={l.criadoEm}
                />
              ))
            ) : (
              <p>Nenhuma atividade registrada ainda.</p>
            )}
          </div>
        </CardDescription>
      </Card>
    </>
  );
}

export default page;
