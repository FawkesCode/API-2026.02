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
import { ReactNode } from "react";
import { cn } from "cn";

interface Ticket {
  id: number;
  title: string;
  type: string;
  openedAt: string;
  createdBy: string;
  teams: Array<string>;
  status: string;
  priority: string;
  description: string;
  recentLogs: Array<TeamLog>;
}

interface TicketCardProps {
  ticket: Ticket;
  projectId: string;
  woLogs?: boolean;
}

interface TeamLog {
  title: string;
  sentBy: string;
  sentAt: string;
}

function TicketCard({ ticket, projectId, woLogs }: TicketCardProps) {
  return (
    <Link
      href={`/projetos/${projectId}/${ticket.id}`}
      className="hover:*:bg-gray-50 hover:*:border hover:*:border-gray-100 focus:*:rounded-xs "
    >
      <Card className="border border-transparent transition-all duration-100 ease-in-out min-h-min h-full justify-between">
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            {ticket.title} | {ticket.type}
          </CardTitle>
          <CardDescription className="border-b pb-4 text-foreground font-medium flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row items-start md:items-center gap-3">
              <span>Aberto em {ticket.openedAt}</span>
              <span className="hidden sm:flex">•</span>
              <span className="flex items-center gap-1">
                <Ticket aria-hidden={true} size="15" /> #{ticket.id}
              </span>
              <span className="hidden sm:flex">•</span>
              <span>
                Aberto por <i>{ticket.createdBy}</i>
              </span>
            </div>
            <div className="flex flex-col gap-2 sm:gap-0 sm:flex-row  justify-between">
              <div className="flex flex-wrap md:flex-nowrap gap-2">
                {ticket.teams.map((team) => (
                  <TeamsBadge key={team}>{team}</TeamsBadge>
                ))}
              </div>
              <div className="flex justify-between  items-center gap-2">
                <span className="underline text-muted-foreground text-xs">
                  {ticket.status}
                </span>
                <PriorityBadge>{ticket.priority}</PriorityBadge>
              </div>
            </div>
          </CardDescription>
        </CardHeader>

        <CardContent className="text-muted-foreground">
          <p>{ticket.description}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div
            className={cn(
              "bg-background w-full p-3 rounded-xl flex flex-col log-view",
              { hidden: woLogs },
            )}
          >
            <h4 className="text-card-foreground font-bold text-md mb-3">
              LOGS Recentes
            </h4>
            <div className="flex flex-col gap-2 mask-[linear-gradient(to_top,transparent,black_2.5rem)]">
              {ticket.recentLogs.map((log) => (
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

function TeamLog({ title, sentBy, sentAt }: TeamLog) {
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
        {sentAt}
      </span>
    </div>
  );
}
