import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "../ui/card";

import Link from "next/link";

interface KpiCardProps {
  title: string;
  qtd: number;
  icon: LucideIcon;
  href: string;
}

function KpiCard({ title, qtd, icon: Icon, href }: KpiCardProps) {
  return (
    <Card className="relative col-span-1  after:content-[''] shrink-0 after:absolute after:inset-0 after:h-1 after:w-full after:bg-accent  py-5">
      <CardContent className="flex-row justify-between">
        <div className="flex gap-3">
          <div className="flex items-center justify-center bg-accent/20 p-2 w-10 mt-1 h-10 text-accent rounded-xl">
            <Icon size={20} />
          </div>
          <div className="flex flex-col justify-center  items-start">
            <h4 className="text-[18px] font-bold text-primary ">{title}</h4>

            <Link
              href={href}
              className="underline text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              Ver todos &gt;&gt;
            </Link>
          </div>
        </div>

        <span className="text-5xl italic text-accent font-medium ml-5">
          {qtd}
        </span>
      </CardContent>
    </Card>
  );
}

export default KpiCard;
