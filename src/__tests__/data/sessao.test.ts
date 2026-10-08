import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { obterSessaoAtual } from "@/auth/sessao";
import { getUsuarioAtual, getUsuarioLogado } from "@/lib/data/sessao";
import { servicoUsuario } from "@/services/usuario.service";

vi.mock("@/lib/auth/sessao", () => ({ obterSessaoAtual: vi.fn() }));
vi.mock("@/lib/services/usuario.service", () => ({
  servicoUsuario: { buscarPorId: vi.fn(), buscarPorEmail: vi.fn() },
}));

const massa = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  nome: "Fernando",
  email: "fernando@massanori.japa",
  cargo: "TECNICO" as const,
  ativo: true,
  equipeId: "550e8400-e29b-41d4-a716-446655440003",
  equipe: { nome: "Equipe Massa" },
};
const gestor = {
  ...massa,
  id: "550e8400-e29b-41d4-a716-446655440002",
  nome: "Gestor da Equipe Massa",
  email: "gestor.seed@example.com",
  cargo: "GESTOR" as const,
};

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("production", "false");
  vi.mocked(obterSessaoAtual).mockResolvedValue(null);
});

afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
});

describe("usuário da interface", () => {
  it("resolve o Massa pelo email do banco, sem depender de um UUID fixo", async () => {
    vi.mocked(servicoUsuario.buscarPorEmail).mockResolvedValue(massa);

    expect(await getUsuarioAtual()).toEqual(massa);
    expect(servicoUsuario.buscarPorEmail).toHaveBeenCalledWith(massa.email);
    expect(servicoUsuario.buscarPorId).not.toHaveBeenCalled();
  });

  it("usa a sessão do gestor em vez do padrão de desenvolvimento", async () => {
    vi.mocked(obterSessaoAtual).mockResolvedValue({ usuarioId: gestor.id });
    vi.mocked(servicoUsuario.buscarPorId).mockResolvedValue(gestor);

    expect(await getUsuarioAtual()).toEqual(gestor);
    expect(servicoUsuario.buscarPorId).toHaveBeenCalledWith(gestor.id);
    expect(servicoUsuario.buscarPorEmail).not.toHaveBeenCalled();
  });

  it.each(["inativo", "removido"])(
    "não substitui a sessão de usuário %s por outro usuário",
    async (estado) => {
      vi.mocked(obterSessaoAtual).mockResolvedValue({ usuarioId: gestor.id });
      vi.mocked(servicoUsuario.buscarPorId).mockResolvedValue(
        estado === "inativo" ? { ...gestor, ativo: false } : null,
      );

      expect(await getUsuarioAtual()).toBeNull();
      expect(servicoUsuario.buscarPorEmail).not.toHaveBeenCalled();
    },
  );

  it.each(["inativo", "ausente"])(
    "retorna null quando o Massa está %s",
    async (estado) => {
      vi.mocked(servicoUsuario.buscarPorEmail).mockResolvedValue(
        estado === "inativo" ? { ...massa, ativo: false } : null,
      );

      expect(await getUsuarioAtual()).toBeNull();
    },
  );

  it.each(["NODE_ENV", "production"])(
    "não seleciona usuário automaticamente em produção (%s)",
    async (variavel) => {
      vi.stubEnv(variavel, variavel === "NODE_ENV" ? "production" : "true");

      expect(await getUsuarioAtual()).toBeNull();
      expect(servicoUsuario.buscarPorEmail).not.toHaveBeenCalled();
    },
  );

  it("o Massa padrão da interface não equivale a uma sessão autenticada", async () => {
    vi.mocked(servicoUsuario.buscarPorEmail).mockResolvedValue(massa);

    expect(await getUsuarioAtual()).toEqual(massa);
    expect(await getUsuarioLogado()).toBeNull();
  });

  it("descarta um usuário autenticado que foi desativado", async () => {
    vi.mocked(obterSessaoAtual).mockResolvedValue({ usuarioId: gestor.id });
    vi.mocked(servicoUsuario.buscarPorId).mockResolvedValue({
      ...gestor,
      ativo: false,
    });

    expect(await getUsuarioLogado()).toBeNull();
  });
});
