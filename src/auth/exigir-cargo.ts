import { NextResponse } from "next/server";
import { obterSessaoDaRequisicao } from "@/auth/sessao";
import { Cargo } from "@/lib/generated/prisma/client";
import { servicoUsuario } from "@/services/usuario.service";

export type AcessoAutorizado = {
  autorizado: true;
  usuario: NonNullable<Awaited<ReturnType<typeof servicoUsuario.buscarPorId>>>;
};

export type ResultadoAcesso =
  | AcessoAutorizado
  | { autorizado: false; resposta: NextResponse };

/** Confere sessão, usuário ainda ativo e cargo permitido numa única função. */
export async function exigirCargo(
  requisicao: Request,
  ...cargosPermitidos: Cargo[]
): Promise<ResultadoAcesso> {
  const sessao = obterSessaoDaRequisicao(requisicao);
  if (!sessao) {
    return {
      autorizado: false,
      resposta: NextResponse.json(
        { erro: "Não autenticado.", codigo: "NAO_AUTENTICADO" },
        { status: 401 },
      ),
    };
  }

  try {
    const usuario = await servicoUsuario.buscarPorId(sessao.usuarioId);
    if (!usuario?.ativo) {
      return {
        autorizado: false,
        resposta: NextResponse.json(
          { erro: "Não autenticado.", codigo: "NAO_AUTENTICADO" },
          { status: 401 },
        ),
      };
    }

    if (!cargosPermitidos.includes(usuario.cargo)) {
      return {
        autorizado: false,
        resposta: NextResponse.json(
          { erro: "Usuário sem permissão.", codigo: "SEM_PERMISSAO" },
          { status: 403 },
        ),
      };
    }

    return { autorizado: true, usuario };
  } catch (erro) {
    console.error("[exigirCargo] Erro ao verificar usuário da sessão:", erro);
    return {
      autorizado: false,
      resposta: NextResponse.json(
        { erro: "Erro interno ao verificar permissão.", codigo: "ERRO_INTERNO" },
        { status: 500 },
      ),
    };
  }
}
