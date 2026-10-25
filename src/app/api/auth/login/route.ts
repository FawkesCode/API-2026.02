import { controladorAuth } from "@/controllers/auth.controller";

export async function POST(requisicao: Request) {
  return controladorAuth.login(requisicao);
}
