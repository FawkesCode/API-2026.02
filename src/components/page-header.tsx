"use client";
import { usePathname } from "next/navigation";

const ROTAS_SEM_TITULO_AUTOMATICO = ["/projetos"];

function PageHeader() {
  const pathname = usePathname();

  if (ROTAS_SEM_TITULO_AUTOMATICO.includes(pathname)) {
    return null;
  }

  return (
    <div className="border-b-2 border-blue-900 pb-2 mb-5">
      <h1 className="text-2xl text-card-foreground font-semibold italic capitalize">
        {children}
      </h1>
    </div>
  );
}

export default PageHeader;