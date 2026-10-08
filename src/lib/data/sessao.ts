import { obterSessaoAtual } from "@/lib/auth/sessao";
import { servicoUsuario } from "@/lib/services/usuario.service";

/**
 * Usuário logado atual, a partir do cookie de sessão. Retorna `null` quando
 * não há sessão válida (ex: usuário ainda não autenticado).
 */
export async function getUsuarioLogado() {
  const sessao = await obterSessaoAtual();
  if (!sessao) return null;

  return servicoUsuario.buscarPorId(sessao.usuarioId);
}
