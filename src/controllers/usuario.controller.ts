import { NextResponse } from "next/server";
import { obterSessaoDaRequisicao } from "@/auth/sessao";
import { Cargo } from "@/lib/generated/prisma/client";
import { servicoUsuario } from "@/services/usuario.service";

const CARGOS_VALIDOS = new Set<string>(Object.values(Cargo));

export class ControladorUsuario {
  async listar(requisicao: Request) {
    const url = new URL(requisicao.url);
    const cargoParam = url.searchParams.get("cargo");

    if (cargoParam && !CARGOS_VALIDOS.has(cargoParam)) {
      return NextResponse.json(
        {
          erro: `cargo inválido. Valores aceitos: ${[...CARGOS_VALIDOS].join(", ")}.`,
        },
        { status: 400 },
      );
    }

    try {
      const usuarios = await servicoUsuario.listarParaSelecao(
        cargoParam as Cargo | undefined,
      );
      return NextResponse.json(usuarios, { status: 200 });
    } catch (erro) {
      console.error(erro);
      return NextResponse.json(
        { erro: "Erro interno ao listar usuários." },
        { status: 500 },
      );
    }
  }

  async listDetailed(requisicao: Request) {
    const sessao = obterSessaoDaRequisicao(requisicao);
    if (!sessao) {
      return NextResponse.json(
        { erro: "Não autenticado.", codigo: "NAO_AUTENTICADO" },
        { status: 401 },
      );
    }

    try {
      const usuario = await servicoUsuario.buscarPorId(sessao.usuarioId);
      if (!usuario?.ativo) {
        return NextResponse.json(
          { erro: "Usuário sem acesso.", codigo: "USUARIO_SEM_ACESSO" },
          { status: 403 },
        );
      }

      const users = await servicoUsuario.listDetailed();
      return NextResponse.json(users, { status: 200 });
    } catch (erro) {
      console.error(erro);
      return NextResponse.json(
        { erro: "Erro interno ao listar usuários.", codigo: "ERRO_INTERNO" },
        { status: 500 },
      );
    }
  }
}

export const controladorUsuario = new ControladorUsuario();
