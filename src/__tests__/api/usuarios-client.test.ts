import { afterEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/lib/generated/prisma/client";
import { POST } from "@/app/api/usuarios/route";
import { prisma } from "@/lib/prisma";
import { getUsuarios } from "@/lib/data/usuarios";
import { parseFiltrosUsuario } from "@/schemas/usuario-filtros.schema";
import {
  cadastrarUsuario,
  MENSAGEM_ERRO_CADASTRO_USUARIO,
} from "@/lib/usuarios-client";
import { OPCOES_TIPO_CONTA } from "@/schemas/usuario-form.schema";

const dadosFormularioValidos = {
  email: "novo.tecnico@altave.com",
  nome: "Novo Técnico",
  tipoConta: OPCOES_TIPO_CONTA[0],
  senha: "Senha@123",
  confirmarSenha: "Senha@123",
};

const fetchDiretoNoRouteHandler = ((
  input: RequestInfo | URL,
  init?: RequestInit,
) => {
  const url =
    typeof input === "string"
      ? `http://localhost${input}`
      : input instanceof URL
        ? input.toString()
        : input.url;
  return POST(new Request(url, init));
}) as typeof fetch;

afterEach(() => vi.restoreAllMocks());

describe("cadastrarUsuario", () => {
  it("envia POST para /api/usuarios com payload mapeado e retorna sucesso", async () => {
    const usuarioCriado = {
      id: "550e8400-e29b-41d4-a716-446655440001",
      nome: "Novo Técnico",
      email: "novo.tecnico@altave.com",
      cargo: "TECNICO",
      ativo: true,
      senhaProvisoria: true,
      equipeId: null,
      criadoEm: "2026-10-17T00:00:00.000Z",
      atualizadoEm: "2026-10-17T00:00:00.000Z",
    };

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(usuarioCriado), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const resultado = await cadastrarUsuario(
      dadosFormularioValidos,
      fetchMock as unknown as typeof fetch,
    );

    expect(fetchMock).toHaveBeenCalledWith("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: "Novo Técnico",
        email: "novo.tecnico@altave.com",
        cargo: "TECNICO",
        senha: "Senha@123",
      }),
    });

    expect(resultado).toEqual({
      sucesso: true,
      usuario: usuarioCriado,
    });
  });

  it("trata resposta 2xx sem corpo JSON sem lançar erro", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));

    const resultado = await cadastrarUsuario(
      dadosFormularioValidos,
      fetchMock as unknown as typeof fetch,
    );

    expect(resultado).toEqual({
      sucesso: true,
      usuario: null,
    });
  });

  it("persiste o novo usuário via POST /api/usuarios e o retorna na listagem atualizada", async () => {
    const criadoEm = new Date("2026-10-17T12:00:00.000Z");
    const registroPersistido = {
      id: "550e8400-e29b-41d4-a716-446655440099",
      nome: dadosFormularioValidos.nome,
      email: dadosFormularioValidos.email,
      cargo: "TECNICO" as const,
      ativo: true,
      senhaProvisoria: true,
      equipeId: null,
      criadoEm,
      atualizadoEm: criadoEm,
    };

    const createSpy = vi
      .spyOn(prisma.usuario, "create")
      .mockResolvedValue(registroPersistido as never);
    vi.spyOn(prisma.usuario, "count").mockResolvedValue(1);
    vi.spyOn(prisma.usuario, "findMany").mockResolvedValue([
      {
        id: registroPersistido.id,
        nome: registroPersistido.nome,
        email: registroPersistido.email,
        cargo: registroPersistido.cargo,
        ativo: true,
        criadoEm,
        equipe: null,
        criadoPor: null,
      },
    ] as never);

    const resultado = await cadastrarUsuario(
      dadosFormularioValidos,
      fetchDiretoNoRouteHandler,
    );

    expect(resultado.sucesso).toBe(true);
    expect(createSpy).toHaveBeenCalledTimes(1);

    const listagemAtualizada = await getUsuarios(parseFiltrosUsuario({}));
    expect(listagemAtualizada.itens).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: registroPersistido.id,
          nome: "Novo Técnico",
          email: "novo.tecnico@altave.com",
          cargoLabel: "Técnico",
          ativo: true,
        }),
      ]),
    );
  });

  it("bloqueia o segundo cadastro com o mesmo e-mail no endpoint POST /api/usuarios e mapeia o erro para o campo email", async () => {
    const emailsCadastrados = new Set<string>();

    vi.spyOn(prisma.usuario, "create").mockImplementation((async (args: {
      data: { email: string; nome: string; cargo: string };
    }) => {
      if (emailsCadastrados.has(args.data.email)) {
        throw new Prisma.PrismaClientKnownRequestError("Unique constraint", {
          code: "P2002",
          clientVersion: "test",
        });
      }
      emailsCadastrados.add(args.data.email);
      return {
        id: "550e8400-e29b-41d4-a716-446655440001",
        nome: args.data.nome,
        email: args.data.email,
        cargo: args.data.cargo,
        ativo: true,
        senhaProvisoria: true,
        equipeId: null,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      };
    }) as never);

    const primeiroCadastro = await cadastrarUsuario(
      dadosFormularioValidos,
      fetchDiretoNoRouteHandler,
    );
    expect(primeiroCadastro.sucesso).toBe(true);

    const segundoCadastroDuplicado = await cadastrarUsuario(
      dadosFormularioValidos,
      fetchDiretoNoRouteHandler,
    );
    expect(segundoCadastroDuplicado).toEqual({
      sucesso: false,
      erro: "Este e-mail já está cadastrado.",
      errosCampos: {
        email: "Este e-mail já está cadastrado.",
      },
    });
  });

  it("retorna mensagem de erro padrão quando ocorre falha de rede", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("Network error"));

    const resultado = await cadastrarUsuario(
      dadosFormularioValidos,
      fetchMock as unknown as typeof fetch,
    );

    expect(resultado).toEqual({
      sucesso: false,
      erro: MENSAGEM_ERRO_CADASTRO_USUARIO,
    });
  });
});
