import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

async function UserLog({
  type,
  desc,
  createdAt,
}: {
  type: string;
  desc: string;
  createdAt: Date;
}) {
  function formatDate(iso: string | Date) {
    return format(new Date(iso), "d 'de' MMM 'às' HH'h'mm", { locale: ptBR });
  }

  return (
    <div className="flex p-3 bg-[#EFF3F8] justify-between rounded-xl">
      <div className="flex gap-2">
        <span className="font-bold text-primary">[{type}]</span>
        <p className="text-foreground">{desc}</p>
      </div>
      <span>{formatDate(createdAt)}</span>
    </div>
  );
}

export default UserLog;
