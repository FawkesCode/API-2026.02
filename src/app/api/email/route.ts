import { emailController } from "@/controllers/email.controller";

export async function POST(request: Request) {
  return emailController.sendAssignmentEmail(request);
}
