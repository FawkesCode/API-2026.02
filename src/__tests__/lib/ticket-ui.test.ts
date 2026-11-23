import { describe, expect, it } from "vitest";
import type { LogItem } from "@/lib/mappers/historico.mapper";
import {
  reconciliarLogs,
  voltarParaPrimeiraPaginaDosTickets,
} from "@/lib/ticket-ui";

describe("atualização da lista após abrir um ticket", () => {
  it("remove só a página, conservando os filtros e o tamanho da lista", () => {
    const url = new URL(
      "https://fawkes.test/tickets?status=EM_ANDAMENTO&titulo=Teste&pagina=2&itensPorPagina=10#lista",
    );

    expect(voltarParaPrimeiraPaginaDosTickets(url)).toBe(
      "/tickets?status=EM_ANDAMENTO&titulo=Teste&itensPorPagina=10#lista",
    );
  });

  it.each(["/tickets?status=EM_ANDAMENTO", "/projetos/x?pagina=2", "/tickets/x?pagina=2"])(
    "não altera a navegação em %s",
    (rota) => {
      expect(voltarParaPrimeiraPaginaDosTickets(new URL(rota, "https://fawkes.test"))).toBeNull();
    },
  );
});

function log(id: string, hora: number, descricao = id): LogItem {
  return {
    id,
    tipo: "manual",
    autorId: "usuario",
    autorNome: "Usuário teste",
    equipe: "Equipe teste",
    setor: "Teste",
    titulo: "Atividade",
    descricao,
    criadoEm: new Date(Date.UTC(2026, 10, 23, hora)),
  };
}

describe("reconciliação dos logs no refresh", () => {
  it("mostra atualizações externas e conserva envios locais ainda ausentes", () => {
    const inicial = log("inicial", 8);
    const proprio = log("proprio", 9);
    const externo = log("externo", 10);
    const { logs, pendentes } = reconciliarLogs([inicial, externo], [proprio]);

    expect(logs).toEqual([inicial, proprio, externo]);
    expect(pendentes).toEqual([proprio]);
  });

  it("usa a versão do servidor sem duplicar e retira os logs confirmados da fila", () => {
    const proprioLocal = log("proprio", 9);
    const proprioConfirmado = log("proprio", 9, "Versão persistida");
    const outroPendente = log("segundo", 10);

    const { logs, pendentes } = reconciliarLogs(
      [proprioConfirmado],
      [proprioLocal, outroPendente],
    );

    expect(logs).toEqual([proprioConfirmado, outroPendente]);
    expect(pendentes).toEqual([outroPendente]);
    expect(reconciliarLogs([], pendentes).logs).toEqual([outroPendente]);
  });
});
