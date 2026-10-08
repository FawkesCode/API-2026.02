import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/tickets/[id]/logs/route";
import { criarTokenDeSessao } from "@/auth/sessao";
import {
  servicoHistoricoTicket,
  UsuarioSemAcessoAoTicketError,
  TransicaoTicketInvalidaError,
} from "@/services/historico.service";

process.env.SESSION_SECRET = "segredo-de-teste-com-32-caracteres";
const ticketId = "550e8400-e29b-41d4-a716-446655440010";
const usuarioId = "550e8400-e29b-41d4-a716-446655440002";
const contexto = { params: Promise.resolve({ id: ticketId }) };
function request(autenticado = true) {
  const token = criarTokenDeSessao({
    usuarioId,
    exp: Math.floor(Date.now() / 1000) + 60,
  });
  return new Request(`http://localhost/api/tickets/${ticketId}/logs`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(autenticado ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      evento: "ENCERRAMENTO_APROVADO",
      descricao: "Aprovado",
      usuarioId: "550e8400-e29b-41d4-a716-446655440009",
    }),
  });
}
afterEach(() => vi.restoreAllMocks());
describe("autorização dos eventos de ticket", () => {
  it("exige sessão", async () => {
    const criar = vi.spyOn(servicoHistoricoTicket, "criar");
    expect((await POST(request(false), contexto)).status).toBe(401);
    expect(criar).not.toHaveBeenCalled();
  });
  it("usa o autor da sessão mesmo que o corpo informe outro usuário", async () => {
    const criar = vi
      .spyOn(servicoHistoricoTicket, "criar")
      .mockResolvedValue(null);
    await POST(request(), contexto);
    expect(criar).toHaveBeenCalledWith(ticketId, {
      evento: "ENCERRAMENTO_APROVADO",
      descricao: "Aprovado",
      usuarioId,
    });
  });
  it.each([
    [new UsuarioSemAcessoAoTicketError(), 403],
    [new TransicaoTicketInvalidaError("Status inválido"), 409],
  ])("retorna o erro de acesso ou transição", async (erro, status) => {
    vi.spyOn(servicoHistoricoTicket, "criar").mockRejectedValue(erro);
    expect((await POST(request(), contexto)).status).toBe(status);
  });
});
