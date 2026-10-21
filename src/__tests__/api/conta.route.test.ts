import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/conta/route";
import { criarTokenDeSessao } from "@/auth/sessao";
import { prisma } from "@/lib/prisma";
import { servicoUsuario } from "@/services/usuario.service";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    usuario: { findUnique: vi.fn() },
    atividadeConta: { create: vi.fn() },
  },
}));

process.env.SESSION_SECRET = "segredo-de-teste-com-32-caracteres";

const usuarioId = "550e8400-e29b-41d4-a716-446655440002";
const token = criarTokenDeSessao({
  usuarioId,
  exp: Math.floor(Date.now() / 1000) + 60,
});

function requisicao(autenticada = true) {
  return new Request("http://localhost/api/conta", {
    headers: autenticada ? { authorization: `Bearer ${token}` } : {},
  });
}

const criadoEm = new Date("2026-10-20T10:00:00.000Z");
const dataAntiga = new Date("2026-10-19T10:00:00.000Z");
const dataRecente = new Date("2026-10-21T10:00:00.000Z");

beforeEach(() => {
  vi.spyOn(servicoUsuario, "buscarPorId").mockResolvedValue({
    id: usuarioId,
    nome: "Suporte Interno",
    email: "suporte@example.com",
    cargo: "SUPORTE_INTERNO",
    ativo: true,
    equipeId: null,
    equipe: null,
  } as never);
});

afterEach(() => vi.restoreAllMocks());

describe("GET /api/conta", () => {
  it("exige sessão autenticada", async () => {
    const resposta = await GET(requisicao(false));

    expect(resposta.status).toBe(401);
    expect(prisma.usuario.findUnique).not.toHaveBeenCalled();
  });

  it("retorna perfil e atividades mais recentes em ordem decrescente", async () => {
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      id: usuarioId,
      nome: "Suporte Interno",
      email: "suporte@example.com",
      cargo: "SUPORTE_INTERNO",
      ativo: true,
      criadoEm,
      atividadesConta: [
        {
          id: "atividade-antiga",
          tipo: "EQUIPE",
          descricao: "Atualizou a equipe.",
          criadoEm: dataAntiga,
        },
      ],
      eventosHistorico: [
        {
          id: "evento-recente",
          evento: "ENCERRAMENTO_SOLICITADO",
          descricao: "Solicitou encerramento.",
          criadoEm: dataRecente,
          ticket: { titulo: "Ticket de teste" },
        },
      ],
    } as never);

    const resposta = await GET(requisicao());
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo).toMatchObject({
      id: usuarioId,
      nome: "Suporte Interno",
      email: "suporte@example.com",
      cargo: "SUPORTE_INTERNO",
      ativo: true,
      criadoEm: criadoEm.toISOString(),
      atividades: [
        {
          id: "evento-recente",
          tipo: "LOG",
          descricao: "Solicitou encerramento. — ticket Ticket de teste",
          criadoEm: dataRecente.toISOString(),
        },
        {
          id: "atividade-antiga",
          tipo: "EQUIPE",
          descricao: "Atualizou a equipe.",
          criadoEm: dataAntiga.toISOString(),
        },
      ],
    });
    expect(prisma.usuario.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: usuarioId } }),
    );
  });

  it("retorna 404 se o usuário autenticado não for encontrado", async () => {
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null);

    const resposta = await GET(requisicao());

    expect(resposta.status).toBe(404);
  });
});
