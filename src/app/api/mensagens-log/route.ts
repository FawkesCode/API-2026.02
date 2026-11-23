import { controladorMensagemPadraoLog } from "@/controllers/mensagem-padrao-log.controller";

export async function GET(requisicao: Request) {
  return controladorMensagemPadraoLog.listar(requisicao);
}

export async function POST(requisicao: Request) {
  return controladorMensagemPadraoLog.criar(requisicao);
}
