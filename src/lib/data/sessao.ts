import { EMAIL_MASSA_SEED } from "@/lib/dev-users";
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

/** Identidade da interface; o Massa do seed é usado somente no desenvolvimento. */
export async function getUsuarioAtual() {
  const sessao = await obterSessaoAtual();
  if (sessao) {
    const usuario = await servicoUsuario.buscarPorId(sessao.usuarioId);
    return usuario?.ativo ? usuario : null;
  }

  if (
    process.env.NODE_ENV === "production" ||
    process.env.production === "true"
  ) {
    return null;
  }

  const massa = await servicoUsuario.buscarPorEmail(EMAIL_MASSA_SEED);
  return massa?.ativo ? massa : null;
}
