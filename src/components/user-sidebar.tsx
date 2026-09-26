import { UsuarioAtual } from "@/hooks/use-current-user";
import { SidebarMenu, SidebarMenuItem } from "./ui/sidebar";

export const AccountTypeLabel: Record<string, string> = {
  TECNICO: "Técnico",
  GESTOR: "Gestor",
  SUPORTE: "Suporte Interno",
  COMERCIAL: "Analista Comercial",
};

function UserSidebar({ user }: { user: UsuarioAtual }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem className=" *:p-0  ">
        <div className="flex gap-3 items-center" data-user>
          <span className="aspect-square size-10 bg-accent flex justify-center items-center text-center rounded-xl text-2xl font-bold">
            {user.nome[0]}
          </span>

          <div className="flex flex-col text-blue-200 overflow-hidden">
            <span className="truncate text-xs capitalize! text-cyan-400 font-bold">
              {AccountTypeLabel[user.cargo]}
            </span>
            <span className="truncate text-sm">{user.nome}</span>
            <span className="truncate text-xs text-blue-200 font-extralight">
              {user.email}
            </span>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export default UserSidebar;
