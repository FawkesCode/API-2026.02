import { controladorProjeto } from "@/lib/controllers/projeto.controller";

export async function GET(requisicao: Request) {
  return controladorProjeto.listar(requisicao);
}

export async function POST(requisicao: Request) {
  return controladorProjeto.criar(requisicao);
}