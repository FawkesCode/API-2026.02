import { controladorSessaoDev } from "@/controllers/sessao-dev.controller";

export async function POST(requisicao: Request) {
  return controladorSessaoDev.entrar(requisicao);
}

export async function DELETE(requisicao: Request) {
  return controladorSessaoDev.sair(requisicao);
}
