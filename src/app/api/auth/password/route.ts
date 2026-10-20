import { controladorAuth } from "@/controllers/auth.controller";

export async function PATCH(requisicao: Request) {
  return controladorAuth.alterarSenha(requisicao);
}
