import { obterSessaoAtual } from "@/auth/sessao";
import { servicoUsuario } from "@/services/usuario.service";

/**
 * Usuário logado atual, a partir do cookie de sessão. Retorna `null` quando
 * não há sessão válida (ex: usuário ainda não autenticado).
 */
export async function getUsuarioLogado() {
  const sessao = await obterSessaoAtual();
  if (!sessao) return null;

  const usuario = await servicoUsuario.buscarPorId(sessao.usuarioId);
  return usuario?.ativo ? usuario : null;
}

/** Identidade autenticada para exibição na interface. */
export async function getUsuarioAtual() {
  const sessao = await obterSessaoAtual();
  if (sessao) {
    const usuario = await servicoUsuario.buscarPorId(sessao.usuarioId);
    return usuario?.ativo ? usuario : null;
  }

  return null;
}
