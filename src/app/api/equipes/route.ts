import { controladorEquipe } from "@/lib/controllers/equipe.controller";

export async function GET() {
  return controladorEquipe.listar();
}
