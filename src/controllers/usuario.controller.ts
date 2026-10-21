import { NextResponse } from "next/server";
import { z } from "zod";
import { Cargo, Prisma } from "@/lib/generated/prisma/client";
import { exigirCargo } from "@/auth/exigir-cargo";
import { createUserSchema } from "@/schemas/user.schema";
import { servicoUsuario } from "@/services/usuario.service";

const CARGOS_VALIDOS = new Set<string>(Object.values(Cargo));

export class ControladorUsuario {
  async createUser(request: Request) {
    const acesso = await exigirCargo(request, Cargo.SUPORTE_INTERNO);
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

    const result = createUserSchema.safeParse(body);
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
      const { senha: password, ...userData } = result.data;
      const user = await servicoUsuario.createUser({
        ...userData,
        password,
        criadoPorId: acesso.usuario.id,
      });
      return NextResponse.json(user, { status: 201 });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return NextResponse.json(
          {
            erro: "Este e-mail já está cadastrado.",
            codigo: "EMAIL_JA_CADASTRADO",
            detalhes: { email: ["Este e-mail já está cadastrado."] },
          },
          { status: 400 },
        );
      }

      console.error(error);
      return NextResponse.json(
        {
          erro: "Erro interno ao cadastrar usuário.",
          codigo: "ERRO_INTERNO",
        },
        { status: 500 },
      );
    }
  }

  async listar(requisicao: Request) {
    const acesso = await exigirCargo(requisicao, Cargo.SUPORTE_INTERNO);
    if (!acesso.autorizado) return acesso.resposta;

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
    const acesso = await exigirCargo(requisicao, Cargo.SUPORTE_INTERNO);
    if (!acesso.autorizado) return acesso.resposta;

    try {
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
