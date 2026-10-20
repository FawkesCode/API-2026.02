import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/equipes/[id]/tecnicos/route";
import { criarTokenDeSessao } from "@/auth/sessao";
import { servicoEquipe } from "@/services/equipe.service";
import { servicoUsuario } from "@/services/usuario.service";

process.env.SESSION_SECRET = "segredo-de-teste-com-32-caracteres";

const teamId = "550e8400-e29b-41d4-a716-446655440000";
const managerId = "550e8400-e29b-41d4-a716-446655440001";
const technicianId = "550e8400-e29b-41d4-a716-446655440002";
const token = criarTokenDeSessao({
  usuarioId: managerId,
  exp: Math.floor(Date.now() / 1000) + 60,
});

function request(authenticated = true) {
  return new Request(`http://localhost/api/equipes/${teamId}/tecnicos`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      ...(authenticated ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ tecnicoIds: [technicianId] }),
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
  it("exige autenticação", async () => {
    const replace = vi.spyOn(servicoEquipe, "replaceTechnicians");
    const response = await PATCH(request(false), {
      params: Promise.resolve({ id: teamId }),
    });

    expect(response.status).toBe(401);
    expect(replace).not.toHaveBeenCalled();
  });

  it("permite que o gestor altere técnicos e encaminha sua identidade", async () => {
    const replace = vi
      .spyOn(servicoEquipe, "replaceTechnicians")
      .mockResolvedValue([]);
    const response = await PATCH(request(), {
      params: Promise.resolve({ id: teamId }),
    });

    expect(response.status).toBe(200);
    expect(replace).toHaveBeenCalledWith(teamId, [technicianId], managerId);
  });

  it("retorna 403 quando o usuário autenticado não é gestor", async () => {
    vi.spyOn(servicoUsuario, "buscarPorId").mockResolvedValue({
      id: managerId,
      nome: "Técnico",
      email: "tecnico@example.com",
      cargo: "TECNICO",
      ativo: true,
      equipeId: teamId,
      equipe: { nome: "Equipe" },
    });
    const replace = vi.spyOn(servicoEquipe, "replaceTechnicians");

    const response = await PATCH(request(), {
      params: Promise.resolve({ id: teamId }),
    });

    expect(response.status).toBe(403);
    expect(replace).not.toHaveBeenCalled();
  });
});
