import { afterEach, describe, expect, it, vi } from "vitest";
import { compare } from "bcryptjs";
import { Prisma } from "@/lib/generated/prisma/client";
import { POST } from "@/app/api/usuarios/route";
import { prisma } from "@/lib/prisma";

const validData = {
  nome: "Ana Silva",
  email: "ana@example.com",
  cargo: "TECNICO",
  senha: "Senha@123",
} as const;

function request(body: unknown) {
  return new Request("http://localhost/api/usuarios", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(() => vi.restoreAllMocks());

describe("user registration", () => {
  it("returns validation errors by field", async () => {
    const create = vi.spyOn(prisma.usuario, "create");
    const response = await POST(
      request({ ...validData, email: "invalid", senha: "weak" }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      erro: "Dados inválidos.",
      codigo: "DADOS_INVALIDOS",
      detalhes: { email: expect.any(Array), senha: expect.any(Array) },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("stores a password hash and does not expose it", async () => {
    const create = vi.spyOn(prisma.usuario, "create").mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440001",
      nome: validData.nome,
      email: validData.email,
      cargo: validData.cargo,
      ativo: true,
      senhaProvisoria: true,
      equipeId: null,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    } as never);

    const response = await POST(request(validData));

    expect(response.status).toBe(201);
    expect(await response.json()).not.toHaveProperty("senhaHash");
    const createdData = create.mock.calls[0][0].data as { senhaHash: string };
    expect(createdData.senhaHash).not.toBe(validData.senha);
    expect(await compare(validData.senha, createdData.senhaHash)).toBe(true);
  });

  it("treats a duplicate email as a validation error", async () => {
    vi.spyOn(prisma.usuario, "create").mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Duplicate email", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    const response = await POST(request(validData));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      erro: "Este e-mail já está cadastrado.",
      codigo: "EMAIL_JA_CADASTRADO",
      detalhes: { email: ["Este e-mail já está cadastrado."] },
    });
  });
});
