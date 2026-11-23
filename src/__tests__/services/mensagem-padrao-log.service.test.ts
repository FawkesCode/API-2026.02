import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { ServicoMensagemPadraoLog } from "@/services/mensagem-padrao-log.service";

describe("serviço de mensagens padrão de log", () => {
  it("filtra a listagem pelo dono e grava a autoria recebida da sessão", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const create = vi.fn().mockResolvedValue({ id: "novo" });
    const db = { mensagemPadraoLog: { findMany, create } } as unknown as PrismaClient;
    const servico = new ServicoMensagemPadraoLog(db);

    await servico.listar("usuario-1");
    await servico.criar("usuario-1", { mensagem: "Começando os trabalhos." });

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { usuarioId: "usuario-1" } }));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: { usuarioId: "usuario-1", mensagem: "Começando os trabalhos." },
    }));
  });
});
