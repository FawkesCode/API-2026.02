import { X } from "lucide-react";
import { cn } from "cn";
import { toIsoOrUndefined } from "@/utils/date";

interface UserMessagesProps {
  sector: string;
  team: string;
  date: Date;
  title: string;
  description: string;
  userName: string;
  align?: "left" | "right";
  onRemoveTag?: () => void;
}

export default function UserMessages({
  sector,
  team,
  date,
  title,
  description,
  userName,
  align = "left",
  onRemoveTag,
}: UserMessagesProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 rounded-xl  border border-gray-200 bg-white p-5 sm:w-1/2",
        align === "right" && "sm:ml-auto",
      )}
    >
      <div className="flex w-fit  items-center gap-2 rounded-full border border-blue-500 bg-blue-200 px-3 py-0.5">
        <span className="text-xs font-semibold text-blue-500">
          {team} | {sector}
        </span>
        {/* <button
          type="button"
          onClick={onRemoveTag}
          aria-label={`Remover ${team} | ${sector}`}
          className="text-blue-700 hover:text-blue-900"
        >
          <X className="h-3 w-3" />
        </button>  Esse botao nao existe para o componente de apresentacao de mensagens, o figma deveria estar sem ele, porem essa retirada foi esquecida */}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-card-foreground">
          {title} | {userName}
        </h3>
        {/* HTML vem do editor Tiptap (schema restrito). O backend precisa sanitizar na escrita antes de aceitar de outros clientes. */}
        <div
          className="text-sm text-muted-foreground [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:pl-5 [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      </div>

      <time
        dateTime={toIsoOrUndefined(date)}
        className="self-end text-xs italic text-muted-foreground"
      >
        Enviada em {date.toLocaleTimeString("pt-BR", { timeStyle: "short" })}
      </time>
    </div>
  );
}
