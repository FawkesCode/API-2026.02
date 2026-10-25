import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/equipes/[id]/tecnicos/route";
import {
  InvalidTechnicianError,
  servicoEquipe,
} from "@/services/equipe.service";
import { criarTokenDeSessao } from "@/auth/sessao";
import { servicoUsuario } from "@/services/usuario.service";

process.env.SESSION_SECRET = "segredo-de-teste-com-32-caracteres";

const teamId = "550e8400-e29b-41d4-a716-446655440000";
const technicianId = "550e8400-e29b-41d4-a716-446655440001";
const managerId = "550e8400-e29b-41d4-a716-446655440002";
const context = { params: Promise.resolve({ id: teamId }) };
const token = criarTokenDeSessao({
  usuarioId: managerId,
  exp: Math.floor(Date.now() / 1000) + 60,
});

function createRequest(body: unknown) {
  return new Request(`http://localhost/api/equipes/${teamId}/tecnicos`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.spyOn(servicoUsuario, "buscarPorId").mockResolvedValue({
    id: managerId,
    nome: "Gestor",
    email: "gestor@example.com",
    cargo: "GESTOR",
    ativo: true,
    equipeId: teamId,
    equipe: { nome: "Equipe" },
  });
});

afterEach(() => vi.restoreAllMocks());

describe("PATCH /api/equipes/:id/tecnicos", () => {
  it("retorna os técnicos finais da equipe", async () => {
    const technicians = [
      {
        id: technicianId,
        nome: "Técnico",
        email: "tecnico@example.com",
        cargo: "TECNICO" as const,
        equipeId: teamId,
      },
    ];
    vi.spyOn(servicoEquipe, "replaceTechnicians").mockResolvedValue(technicians);

    const response = await PATCH(
      createRequest({ tecnicoIds: [technicianId] }),
      context,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(technicians);
    expect(servicoEquipe.replaceTechnicians).toHaveBeenCalledWith(
      teamId,
      [technicianId],
      managerId,
    );
  });

  it("retorna 404 quando a equipe não existe", async () => {
    vi.spyOn(servicoEquipe, "replaceTechnicians").mockResolvedValue(null);

    const response = await PATCH(createRequest({ tecnicoIds: [] }), context);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      erro: "Equipe não encontrada.",
      codigo: "TEAM_NOT_FOUND",
    });
  });

  it("retorna 400 quando algum usuário não é técnico ou não existe", async () => {
    vi.spyOn(servicoEquipe, "replaceTechnicians").mockRejectedValue(
      new InvalidTechnicianError(),
    );

    const response = await PATCH(
      createRequest({ tecnicoIds: [technicianId] }),
      context,
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      erro: "Todos os tecnicoIds devem corresponder a usuários com cargo TECNICO.",
      codigo: "INVALID_TECHNICIAN_IDS",
    });
  });

  it("retorna 400 para um corpo inválido", async () => {
    const replaceTechnicians = vi.spyOn(servicoEquipe, "replaceTechnicians");

    const response = await PATCH(
      createRequest({ tecnicoIds: ["invalido"] }),
      context,
    );

    expect(response.status).toBe(400);
    expect(replaceTechnicians).not.toHaveBeenCalled();
  });
});
