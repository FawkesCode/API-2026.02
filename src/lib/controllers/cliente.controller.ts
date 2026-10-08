import { NextResponse } from "next/server";
import { servicoCliente } from "@/lib/services/cliente.service";

export class ControladorCliente {
  async listar(_requisicao: Request) {
    try {
      const clientes = await servicoCliente.listarParaSelecao();
      return NextResponse.json(clientes, { status: 200 });
    } catch (erro) {
      console.error(erro);
      return NextResponse.json({ erro: "Erro interno ao listar clientes." }, { status: 500 });
    }
  }
}

export const controladorCliente = new ControladorCliente();