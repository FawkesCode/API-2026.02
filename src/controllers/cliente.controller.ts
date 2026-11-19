import { NextResponse } from "next/server";
import { z } from "zod";
import { Cargo, Prisma } from "@/lib/generated/prisma/client";
import { exigirCargo, exigirSessao } from "@/auth/exigir-cargo";
import { createClientSchema, updateClientSchema } from "@/schemas/client.schema";
import {
  ErroClienteNaoEncontrado,
  ErroClientePossuiProjetos,
  ErroClientePossuiProjetosAtivos,
  ErroCnpjJaCadastrado,
  ErroNomeClienteJaCadastrado,
  servicoCliente,
} from "@/services/cliente.service";

function handleClientWriteError(error: unknown, internalErrorMessage: string) {
  if (error instanceof ErroClienteNaoEncontrado) {
    return NextResponse.json(
      { erro: error.message, codigo: "CLIENTE_NAO_ENCONTRADO" },
      { status: 404 },
    );
  }
  if (error instanceof ErroClientePossuiProjetosAtivos) {
    return NextResponse.json(
      { erro: error.message, codigo: "CLIENTE_POSSUI_PROJETOS_ATIVOS" },
      { status: 400 },
    );
  }
  if (
    error instanceof ErroClientePossuiProjetos ||
    (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003")
  ) {
    return NextResponse.json(
      {
        erro: new ErroClientePossuiProjetos().message,
        codigo: "CLIENTE_POSSUI_PROJETOS",
      },
      { status: 400 },
    );
  }
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
    { erro: internalErrorMessage, codigo: "ERRO_INTERNO" },
    { status: 500 },
  );
}

async function readJsonBody(
  request: Request,
): Promise<{ ok: true; body: unknown } | { ok: false; response: NextResponse }> {
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        {
          erro: "Corpo da requisição precisa ser um JSON válido.",
          codigo: "JSON_INVALIDO",
        },
        { status: 400 },
      ),
    };
  }
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

  async listDetailed(request: Request) {
    const acesso = await exigirCargo(request, Cargo.COMERCIAL);
    if (!acesso.autorizado) return acesso.resposta;

    try {
      const clients = await servicoCliente.listDetailed();
      return NextResponse.json(clients, { status: 200 });
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        { erro: "Erro interno ao listar clientes.", codigo: "ERRO_INTERNO" },
        { status: 500 },
      );
    }
  }

  async getClient(request: Request, clientId: string) {
    const validatedId = z.uuid().safeParse(clientId);
    if (!validatedId.success) {
      return NextResponse.json(
        { erro: "ID do cliente inválido.", codigo: "ID_INVALIDO" },
        { status: 400 },
      );
    }

    const acesso = await exigirCargo(request, Cargo.COMERCIAL);
    if (!acesso.autorizado) return acesso.resposta;

    try {
      const client = await servicoCliente.getClientById(validatedId.data);
      if (!client) {
        return NextResponse.json(
          {
            erro: new ErroClienteNaoEncontrado().message,
            codigo: "CLIENTE_NAO_ENCONTRADO",
          },
          { status: 404 },
        );
      }
      return NextResponse.json(client, { status: 200 });
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        { erro: "Erro interno ao buscar cliente.", codigo: "ERRO_INTERNO" },
        { status: 500 },
      );
    }
  }

  async createClient(request: Request) {
    const acesso = await exigirCargo(request, Cargo.COMERCIAL);
    if (!acesso.autorizado) return acesso.resposta;

    const json = await readJsonBody(request);
    if (!json.ok) return json.response;

    const result = createClientSchema.safeParse(json.body);
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
      return handleClientWriteError(error, "Erro interno ao cadastrar cliente.");
    }
  }

  async updateClient(request: Request, clientId: string) {
    const validatedId = z.uuid().safeParse(clientId);
    if (!validatedId.success) {
      return NextResponse.json(
        { erro: "ID do cliente inválido.", codigo: "ID_INVALIDO" },
        { status: 400 },
      );
    }

    const acesso = await exigirCargo(request, Cargo.COMERCIAL);
    if (!acesso.autorizado) return acesso.resposta;

    const json = await readJsonBody(request);
    if (!json.ok) return json.response;

    const result = updateClientSchema.safeParse(json.body);
    if (!result.success) {
      const flattened = z.flattenError(result.error);
      return NextResponse.json(
        {
          erro: flattened.formErrors[0] ?? "Dados inválidos.",
          codigo: "DADOS_INVALIDOS",
          detalhes: flattened.fieldErrors,
        },
        { status: 400 },
      );
    }

    try {
      const client = await servicoCliente.updateClient(validatedId.data, result.data);
      return NextResponse.json(client, { status: 200 });
    } catch (error) {
      return handleClientWriteError(error, "Erro interno ao atualizar cliente.");
    }
  }

  async deleteClient(request: Request, clientId: string) {
    const validatedId = z.uuid().safeParse(clientId);
    if (!validatedId.success) {
      return NextResponse.json(
        { erro: "ID do cliente inválido.", codigo: "ID_INVALIDO" },
        { status: 400 },
      );
    }

    const acesso = await exigirCargo(request, Cargo.COMERCIAL);
    if (!acesso.autorizado) return acesso.resposta;

    try {
      await servicoCliente.deleteClient(validatedId.data);
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      return handleClientWriteError(error, "Erro interno ao excluir cliente.");
    }
  }
}

export const controladorCliente = new ControladorCliente();
