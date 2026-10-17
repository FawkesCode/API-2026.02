import type { FiltrosUsuario } from "@/schemas/usuario-filtros.schema";
import { servicoUsuario } from "@/services/usuario.service";
import type { UsuariosPaginados } from "@/types/usuario";
import { toUsuarioListaItem } from "../mappers/usuario.mapper";

/** Leitura da tela de usuários: I/O + mapper fora do JSX. */
export async function getUsuarios(
  filtros: FiltrosUsuario,
): Promise<UsuariosPaginados> {
  const { itens, total, pagina, totalPaginas } =
    await servicoUsuario.listarPaginado(filtros);

  return { itens: itens.map(toUsuarioListaItem), total, pagina, totalPaginas };
}