import { NextResponse } from "next/server";
import { z } from "zod";
import { Cargo } from "@/lib/generated/prisma/client";
import { exigirCargo } from "@/auth/exigir-cargo";
import { criarMensagemPadraoLogSchema } from "@/schemas/mensagem-padrao-log.schema";
import { servicoMensagemPadraoLog } from "@/services/mensagem-padrao-log.service";

const cargosComLogs = [Cargo.TECNICO, Cargo.GESTOR, Cargo.SUPORTE];

export class ControladorMensagemPadraoLog {
  async listar(requisicao: Request) {
    const acesso = await exigirCargo(requisicao, ...cargosComLogs);
    if (!acesso.autorizado) return acesso.resposta;

    try {
      const mensagens = await servicoMensagemPadraoLog.listar(acesso.usuario.id);
      return NextResponse.json(mensagens, { status: 200 });
    } catch (erro) {
      console.error("[mensagens-log] Falha ao listar:", erro);
      return NextResponse.json({ erro: "Erro interno ao listar mensagens padrão." }, { status: 500 });
    }
  }

  async criar(requisicao: Request) {
    const acesso = await exigirCargo(requisicao, ...cargosComLogs);
    if (!acesso.autorizado) return acesso.resposta;

    let corpo: unknown;
    try {
      corpo = await requisicao.json();
    } catch {
      return NextResponse.json({ erro: "Corpo da requisição precisa ser um JSON válido." }, { status: 400 });
    }
    const resultado = criarMensagemPadraoLogSchema.safeParse(corpo);
    if (!resultado.success) {
      return NextResponse.json({
        erro: "Dados inválidos.",
        detalhes: z.flattenError(resultado.error).fieldErrors,
      }, { status: 400 });
    }

    try {
      const mensagem = await servicoMensagemPadraoLog.criar(acesso.usuario.id, resultado.data);
      return NextResponse.json(mensagem, { status: 201 });
    } catch (erro) {
      console.error("[mensagens-log] Falha ao salvar:", erro);
      return NextResponse.json({ erro: "Erro interno ao salvar mensagem padrão." }, { status: 500 });
    }
  }
}

export const controladorMensagemPadraoLog = new ControladorMensagemPadraoLog();
