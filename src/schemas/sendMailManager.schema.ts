import{ z }from "zod";

export const sendMailToManager = z.object({
managerId: z.string().trim().min(1,"Id do gestor é obrigatório"),
ticketId: z.string().trim().min(1,"Id do ticket é necessário.")

})