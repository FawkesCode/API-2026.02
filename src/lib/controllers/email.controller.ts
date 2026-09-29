import { NextResponse } from "next/server";
import { z } from "zod";
import EmailManagerService from "@/lib/services/email.service";
import { sendMailToManager } from "@/schemas/sendMailManager.schema";


async function extractJson(request: Request) {
  try {
    return { body: (await request.json()) as unknown, error: null };
  } catch {
    return {
      body: null,
      error: NextResponse.json(
        { error: "Request body must be a valid JSON." },
        { status: 400 },
      ),
    };
  }
}

function validateBody<T>(schema: z.ZodType<T>, body: unknown) {
  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      data: null,
      error: NextResponse.json(
        { error: "Invalid data.", details: z.flattenError(result.error).fieldErrors },
        { status: 400 },
      ),
    };
  }
  return { data: result.data, error: null };
}

export class EmailController {
  async sendAssignmentEmail(request: Request) {
    const { body, error: parseError } = await extractJson(request);
    if (parseError) return parseError;

    const { data, error: validationError } = validateBody(sendMailToManager, body);
    if (validationError) return validationError;

    try {
      const { managerId, ticketId } = data;

      const emailService = new EmailManagerService(managerId, ticketId);
      const result = await emailService.sendMail();

      if (result && !result.success) {
        return NextResponse.json(
          { error: "Failed to send email.", details: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { message: "Email sent successfully!", messageId: result?.messageId },
        { status: 200 }
      );
    } catch (error: any) {
      console.error("Error sending email:", error);

      if (error.message === "Perfil inativo ou não encontrado." || error.message === "Ticket não encontrado.") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      return NextResponse.json(
        { error: "Internal error while trying to send email." },
        { status: 500 }
      );
    }
  }
}

export const emailController = new EmailController();

