import { NextResponse } from "next/server";
import { exigirSessao } from "@/auth/exigir-cargo";
import { servicoCliente } from "@/services/cliente.service";

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
}

export const controladorCliente = new ControladorCliente();
