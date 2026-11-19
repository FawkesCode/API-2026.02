import { NextResponse } from "next/server";
import { z } from "zod";
import { Cargo, Prisma } from "@/lib/generated/prisma/client";
import { exigirCargo, exigirSessao } from "@/auth/exigir-cargo";
import { createClientSchema } from "@/schemas/client.schema";
import {
  ErroCnpjJaCadastrado,
  ErroNomeClienteJaCadastrado,
  servicoCliente,
} from "@/services/cliente.service";

function handleCreateClientError(error: unknown) {
  if (error instanceof ErroCnpjJaCadastrado) {
    return NextResponse.json(
      {
        erro: error.message,
        codigo: "CNPJ_JA_CADASTRADO",
        detalhes: { cnpj: [error.message] },
      },
      { status: 400 },
    );
  }
  if (error instanceof ErroNomeClienteJaCadastrado) {
    return NextResponse.json(
      {
        erro: error.message,
        codigo: "NOME_CLIENTE_JA_CADASTRADO",
        detalhes: { nome: [error.message] },
      },
      { status: 400 },
    );
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      { erro: "Este cliente já está cadastrado.", codigo: "CLIENTE_JA_CADASTRADO" },
      { status: 400 },
    );
  }

  console.error(error);
  return NextResponse.json(
    { erro: "Erro interno ao cadastrar cliente.", codigo: "ERRO_INTERNO" },
    { status: 500 },
  );
}

export class ControladorCliente {
  async listar(requisicao: Request) {
    const acesso = await exigirSessao(requisicao);
    if (!acesso.autorizado) return acesso.resposta;

    try {
      const clientes = await servicoCliente.listarParaSelecao();
      return NextResponse.json(clientes, { status: 200 });
    } catch (erro) {
      console.error(erro);
      return NextResponse.json(
        { erro: "Erro interno ao listar clientes." },
        { status: 500 },
      );
    }
  }

  async createClient(request: Request) {
    const acesso = await exigirCargo(request, Cargo.COMERCIAL);
    if (!acesso.autorizado) return acesso.resposta;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          erro: "Corpo da requisição precisa ser um JSON válido.",
          codigo: "JSON_INVALIDO",
        },
        { status: 400 },
      );
    }

    const result = createClientSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          erro: "Dados inválidos.",
          codigo: "DADOS_INVALIDOS",
          detalhes: z.flattenError(result.error).fieldErrors,
        },
        { status: 400 },
      );
    }

    try {
      const client = await servicoCliente.createClient(result.data);
      return NextResponse.json(client, { status: 201 });
    } catch (error) {
      return handleCreateClientError(error);
    }
  }
}

export const controladorCliente = new ControladorCliente();
