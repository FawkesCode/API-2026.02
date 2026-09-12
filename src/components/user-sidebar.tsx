import { SidebarMenuButton } from "./ui/sidebar";

function UserSidebar() {
  return (
    <div className="flex gap-3 items-center">
      <span className="aspect-square size-10 bg-accent flex justify-center items-center text-center rounded-xl text-2xl font-bold">
        U
      </span>

      <div className="flex flex-col text-blue-200 overflow-hidden">
        <span className="truncate text-xs text-cyan-400 font-bold">
          Tipo de conta
        </span>
        <span className="truncate text-sm">Nome do Usuário</span>
        <span className="truncate text-xs text-blue-200 font-extralight">
          email@gmail.com
        </span>
      </div>
    </div>
  );
}

export default UserSidebar;
