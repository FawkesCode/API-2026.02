"use client";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { ChevronsLeft, Ticket } from "lucide-react";
import { Badge } from "./ui/badge";
import { PriorityBadge } from "./priority-badge";
import { ReactNode, useEffect, useState } from "react";
import { cn } from "cn";
import { TeamLogView, TicketView } from "@/types/ticket";
import { Button } from "./ui/button";
import { toTicketDTO } from "@/lib/mappers/ticket.mapper";
import {
  addMyTeamAction,
  getRecentLogs,
  removeMyTeamAction,
} from "@/lib/actions/ticket";
import { usePathname } from "next/navigation";
import { toast } from "./ui/toast";

interface TicketCardProps {
  ticket: TicketView;
  woLogs?: boolean;
  ticketUrl: string;
}

type PriorityLevel = "critical" | "high" | "medium" | "low";

const TicketPriorityMap: Record<string, PriorityLevel> = {
  Baixa: "low",
  Média: "medium",
  Alta: "high",
  Crítica: "critical",
};

function TicketCard({ ticket, woLogs, ticketUrl }: TicketCardProps) {
  const [curTicket, setCurTicket] = useState(ticket);
  const [isLoading, setIsLoading] = useState(false);
  const [isLogLoading, setIsLogLoading] = useState(false);

  const pathname = usePathname();

  // TODO: Trocar o id pelo recebido pelo mock de usuário
  const loggedUserTeam = "10aba42f-f057-42b7-a9f7-a9760e241524";

  const handleManageTeam = async (id: string, type?: string) => {
    setIsLoading(true);

    try {
      const res =
        type === "add"
          ? await addMyTeamAction(curTicket.id, id, pathname)
          : await removeMyTeamAction(curTicket.id, id, pathname);

      if (!res.success) {
        toast.add({
          type: "error",
          description: res.error,
          priority: "high",
        });
        return;
      }

      const updatedTicket = toTicketDTO(res.data);
      setCurTicket(updatedTicket);
    } catch (err) {
      toast.add({
        type: "error",
        description: `Erro de conexão com o servidor: ${err}`,
        priority: "high",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function fetchLogs() {
      setIsLogLoading(true);
      try {
        const logs = await getRecentLogs(curTicket.id);
        setCurTicket((state) =>
          state ? { ...state, recentLogs: logs } : state,
        );
      } catch (err) {
        console.error("Erro ao carregar logs:", err);
      } finally {
        setIsLogLoading(false);
      }
    }

    if (curTicket.id) {
      fetchLogs();
    }
  }, [curTicket.id]);

  return (
    <Link
      href={ticketUrl}
      className="hover:*:bg-gray-50 hover:*:border hover:*:border-gray-100 focus:*:rounded-xs "
    >
      <Card className="border border-transparent transition-all duration-100 ease-in-out min-h-min h-full justify-between">
        <CardHeader>
          <CardTitle className="flex justify-between">
            <div className="text-xl flex gap-2 items-center font-bold">
              <Ticket aria-hidden={true} size="20" /> {curTicket.title}{" "}
              {curTicket.type !== "" && "| "}
              {curTicket.type}
            </div>
          </CardTitle>
          <CardDescription className="border-b pb-4 text-foreground font-medium flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row items-start md:items-center gap-3">
              <span className="text-accent">
                Tempo restante: {curTicket.timeRemaining}
              </span>

              <p className="text-foreground font-normal">
                Aberto em {curTicket.openedAt} por
                <span className=" italic"> {curTicket.createdBy}</span>
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:gap-0 sm:flex-row  justify-between">
              <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
                {curTicket.teams && curTicket.teams.length > 0 ? (
                  curTicket.teams.map((team) => (
                    <TeamsBadge key={team.id}>{team.nome}</TeamsBadge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Times atribuídos não definidos
                  </span>
                )}
                {curTicket.teams.some((team) => team.id === loggedUserTeam) ? (
                  <TeamAddButton
                    style="outline"
                    onClick={() => handleManageTeam(loggedUserTeam)}
                  >
                    {isLoading ? "Desatribuindo" : "Desatribuir Equipe"}
                  </TeamAddButton>
                ) : (
                  <TeamAddButton
                    style="secondary"
                    onClick={() => handleManageTeam(loggedUserTeam, "add")}
                  >
                    {isLoading ? "Atribuindo" : "Atribuir Equipe"}
                  </TeamAddButton>
                )}
              </div>
              <div className="flex justify-between  items-center gap-2">
                <span className="underline text-muted-foreground text-xs">
                  {curTicket.status}
                </span>
                <PriorityBadge priority={TicketPriorityMap[curTicket.priority]}>
                  {curTicket.priority}
                </PriorityBadge>
              </div>
            </div>
          </CardDescription>
        </CardHeader>

        <CardContent className="text-muted-foreground">
          <p>{curTicket.description}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div
            className={cn(
              "bg-background w-full p-3 rounded-xl flex flex-col log-view",
              (!curTicket.recentLogs ||
                curTicket.recentLogs.length === 0 ||
                woLogs) &&
                "hidden!",
            )}
          >
            {isLogLoading ? (
              "Carregando logs"
            ) : (
              <>
                <h4 className="text-card-foreground font-bold text-md mb-3">
                  LOGS Recentes
                </h4>
                <div className="flex flex-col gap-2 mask-[linear-gradient(to_top,transparent,black_1.5rem)]">
                  {curTicket.recentLogs?.map((log) => (
                    <TeamLog
                      key={`${log.title}-${log.sentAt}`}
                      title={log.title}
                      sentBy={log.sentBy}
                      sentAt={log.sentAt}
                    />
                  ))}
                </div>
                <span className="cursor-pointer font-bold text-xs bg-transparent text-center text-card-foreground hover:underline  hover:bg-transparent">
                  Ver mais
                </span>
              </>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

export default TicketCard;

function TeamsBadge({ children }: { children: ReactNode }) {
  return (
    <Badge
      variant="default"
      className="bg-transparent text-muted-foreground border-muted-foreground text-xs p-3"
    >
      {children}
    </Badge>
  );
}

function TeamLog({ title, sentBy, sentAt }: TeamLogView) {
  return (
    <div className=" flex flex-col sm:flex-row gap-3 items-center">
      <div className="flex flex-col sm:flex-row p-2 rounded-full pl-4 pr-4 bg-[#E6E7F2]  w-full xl:w-[50%] justify-between text-[#ACADC0]">
        <p className="font-medium">{title}</p>
        <p>
          <i>Enviado por {sentBy}</i>
        </p>
      </div>
      <span className="flex gap-1 items-center text-[#ACADC0]">
        <ChevronsLeft />
        {sentAt.toLocaleTimeString("pt-BR", { timeStyle: "short" })}
      </span>
    </div>
  );
}

function TeamAddButton({
  children,
  style,
  onClick,
}: {
  children: ReactNode;
  style?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "destructive"
    | "link"
    | null
    | undefined;
  onClick?: () => void;
}) {
  return (
    <Button
      variant={style}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick?.();
      }}
      className="p-1 pr-4 pl-4 h-auto  rounded-3xl text-[11px]"
    >
      {children}
    </Button>
  );
}
