import { controladorProjeto } from "@/lib/controllers/projeto.controller";

export async function POST(requisicao: Request) {
  return controladorProjeto.criar(requisicao);
}