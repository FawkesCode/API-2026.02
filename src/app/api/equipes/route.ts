import { controladorEquipe } from "@/controllers/equipe.controller";

export async function GET(request: Request) {
  return controladorEquipe.listar(request);
}
