import { controladorAuth } from "@/controllers/auth.controller";

export async function POST() {
  return controladorAuth.logout();
}
