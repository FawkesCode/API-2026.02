import { NextResponse, type NextRequest } from "next/server";
import { obterSessaoDaRequisicao } from "@/auth/sessao";

/**
 * Checagem otimista das telas: só confere se o cookie de sessão é válido.
 * Cargo e usuário ativo continuam sendo verificados nas páginas e nos
 * controllers, porque o proxy não deve consultar o banco.
 *
 * A tela de login (`/`) fica de fora: quem entra com senha provisória já tem
 * cookie e precisa continuar nela para trocar a senha.
 */
export function proxy(requisicao: NextRequest) {
  if (!obterSessaoDaRequisicao(requisicao)) {
    return NextResponse.redirect(new URL("/", requisicao.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/projetos/:path*",
    "/tickets/:path*",
    "/equipe/:path*",
    "/usuarios/:path*",
    "/perfil/:path*",
  ],
};
