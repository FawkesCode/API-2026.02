# Agregações do Dashboard — Volume, Status e Urgência

Documentação de referência técnica (para humanos e agentes de código) das funções TypeScript criadas para alimentar os endpoints de API e Server Components do dashboard de chamados.

---

## Mapa de Arquivos

| Camada | Arquivo | Import (`@/`) | Responsabilidade |
| --- | --- | --- | --- |
| Enums (client-safe) | `src/types/ticket-enums.ts` | `@/types/ticket-enums` | Espelho dos enums do Prisma (`StatusTicket`, `Prioridade`, `Categoria`, `Cargo`) seguro para componentes client. |
| Contratos / DTOs | `src/types/dashboard.ts` | `@/types/dashboard` | Interfaces de filtros, retornos das agregações, ordens fixas e rótulos em português. |
| Validação (Zod v4) | `src/schemas/dashboard.schema.ts` | `@/schemas/dashboard.schema` | Validação e normalização de query params/objetos de filtro. |
| Serviço / Consultas | `src/services/dashboard.service.ts` | `@/services/dashboard.service` | Montagem de `where` Prisma e consultas agregadas no MySQL. |
| Data Access (Next.js) | `src/lib/data/dashboard.ts` | `@/lib/data/dashboard` | Wrappers server-side com tratamento de erro para uso em Server Components. |
| Testes | `src/__tests__/schemas/dashboard.schema.test.ts` | — | Testes unitários de validação e normalização de filtros. |
| Testes | `src/__tests__/services/dashboard.service.test.ts` | — | Testes unitários das consultas, regras de domínio e edge cases. |

> **Regra de bundler (Next.js):** Componentes `"use client"` devem importar tipos e enums apenas de `@/types/dashboard` e `@/types/ticket-enums`. Nunca importe `@/lib/generated/prisma/client` no navegador.

---

## Regras de Domínio e Banco de Dados

| Filtro (`FiltrosDashboard`) | Coluna / Relação no Banco | Regra aplicada |
| --- | --- | --- |
| `equipeId` | `ticket_equipes` (`Ticket.equipesAlocadas`) | Usa alocação real do ticket (não `projetos.equipe_id`), pois um ticket pode ser atendido por múltiplas equipes. Omitido ou `"todas"` = todas as equipes. |
| `usuarioId` | `tickets.aberto_por_id`, `tickets.responsavel_id`, `historico_ticket.usuario_id` | Inclui tickets abertos pelo usuário, atribuídos a ele como responsável ou nos quais ele registrou logs/atividades (`OR`). |
| `projetoId` | `tickets.projeto_id` | Filtro direto por projeto. |
| `clienteId` | `projetos.cliente_id` (`Ticket.projeto.clienteId`) | Filtra indiretamente via projeto do ticket. |
| `data` | `tickets.criado_em` ou `tickets.encerrado_em` | Dia único inclusivo (`00:00:00.000` até `23:59:59.999`). |
| `dataInicio` / `dataFim` | `tickets.criado_em` ou `tickets.encerrado_em` | Período inclusivo nas pontas (`startOfDay`..`endOfDay`). Aceita intervalo aberto (apenas uma ponta). Tem precedência sobre `data` se ambos vierem preenchidos. |

### Invariantes importantes

1. **Criados vs. Fechados com filtro de data:**
   - `contarChamadosCriados`, `agruparPorStatus`, `agruparAbertosPorEquipe`, `agruparPorUrgencia` e `agruparPorSla` aplicam o filtro de data sobre `criadoEm`.
   - `contarChamadosFechados` aplica `status = ENCERRADO` e, quando há filtro de data, filtra por `encerradoEm` (refletindo quantos chamados foram encerrados no período).
   - Para saber quantos tickets *criados no período* já estão encerrados, consulte o item `ENCERRADO` dentro de `porStatus.itens`.
2. **Sem dupla contagem em tickets multi-equipe:**
   - Um ticket alocado a 2 equipes entra na barra de cada equipe em `abertosPorEquipe.equipes`, mas conta apenas **1 vez** em `abertosPorEquipe.totalAbertos` e `volume.abertos`.
3. **Urgência = `Ticket.prioridade`:**
   - O banco modela urgência pelo enum `Prioridade` (`CRITICA`, `ALTA`, `MEDIA`, `BAIXA`).
4. **Preenchimento de zeros e ordem estável:**
   - `agruparPorStatus` retorna sempre os 5 status em ordem fixa.
   - `agruparPorUrgencia` retorna sempre os 4 níveis (`Crítica → Alta → Média → Baixa`).
   - `agruparPorSla` retorna sempre as 6 faixas (`4 horas → 8 horas → 1 dia → 2 dias → 3 dias → 7 dias`).
   - `agruparAbertosPorEquipe` inclui equipes ativas mesmo com `quantidade: 0`, ordenadas alfabeticamente por `nome`.

---

## 1. Camada de Validação (`src/schemas/dashboard.schema.ts`)

### `filtrosDashboardSchema`

- **Tipo:** `z.ZodObject` com `superRefine`
- **Import:** `import { filtrosDashboardSchema, type FiltrosDashboardSchema } from "@/schemas/dashboard.schema";`
- **Objetivo:** Validar e normalizar um objeto de filtros do dashboard antes de enviá-lo à camada de serviço.

#### Campos e transformações

| Campo | Entrada aceita | Normalização | Regra de validação |
| --- | --- | --- | --- |
| `equipeId` | `string \| undefined` | Espaços aparados; `""` ou `"todas"` (case-insensitive) → `undefined` | UUID v4/padrão válido (`z.uuid`) quando presente |
| `usuarioId` | `string \| undefined` | Espaços aparados; `""` → `undefined` | UUID válido quando presente |
| `projetoId` | `string \| undefined` | Espaços aparados; `""` → `undefined` | UUID válido quando presente |
| `clienteId` | `string \| undefined` | Espaços aparados; `""` → `undefined` | UUID válido quando presente |
| `data` | `string \| undefined` | Espaços aparados; `""` → `undefined` | Formato `YYYY-MM-DD` e data válida no calendário (`date-fns/parseISO` + `isValid`) |
| `dataInicio` | `string \| undefined` | Espaços aparados; `""` → `undefined` | Formato `YYYY-MM-DD` e data válida no calendário |
| `dataFim` | `string \| undefined` | Espaços aparados; `""` → `undefined` | Formato `YYYY-MM-DD`, data válida e `dataFim >= dataInicio` (quando ambos existem) |

---

### `validarFiltrosDashboard(params)`

- **Assinatura:**
  ```ts
  export function validarFiltrosDashboard(
    params: URLSearchParams | Record<string, string | string[] | undefined>,
  ): z.ZodSafeParseResult<FiltrosDashboardSchema>
  ```
- **Import:** `import { validarFiltrosDashboard } from "@/schemas/dashboard.schema";`
- **Objetivo:** Extrair os 7 parâmetros aceitos diretamente de `new URL(requisicao.url).searchParams` (API Routes) ou `await searchParams` (Server Components Next.js) e validá-los com `filtrosDashboardSchema.safeParse`.
- **Regras e edge cases:**
  - Ignora parâmetros desconhecidos presentes na URL.
  - Em objetos com valores `string[]` (ex.: query param repetido), usa o primeiro elemento (`valor[0]`).
  - Nunca lança exceção; retorna `{ success: true, data }` ou `{ success: false, error }`.
- **Exemplo de uso (em controller):**
  ```ts
  const { searchParams } = new URL(requisicao.url);
  const validacao = validarFiltrosDashboard(searchParams);

  if (!validacao.success) {
    return NextResponse.json(
      {
        erro: "Parâmetros de filtro inválidos.",
        detalhes: z.flattenError(validacao.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  const dados = await servicoDashboard.obterAgregacoesVolumeStatusUrgencia(
    validacao.data,
  );
  ```

---

## 2. Camada de Serviço (`src/services/dashboard.service.ts`)

### `resolverIntervaloDatasDashboard(filtros?)`

- **Assinatura:**
  ```ts
  export function resolverIntervaloDatasDashboard(
    filtros?: Pick<FiltrosDashboard, "data" | "dataInicio" | "dataFim">,
  ): Prisma.DateTimeFilter<"Ticket"> | undefined
  ```
- **Import:** `import { resolverIntervaloDatasDashboard } from "@/services/dashboard.service";`
- **Objetivo:** Converter os campos de data em string (`YYYY-MM-DD`) em um filtro `DateTimeFilter` do Prisma com limites inclusivos (`startOfDay` e `endOfDay`).
- **Comportamento por cenário:**
  - Sem datas válidas → retorna `undefined`.
  - Apenas `data: "2026-11-10"` → `{ gte: startOfDay(2026-11-10), lte: endOfDay(2026-11-10) }`.
  - `dataInicio` e `dataFim` → `{ gte: startOfDay(dataInicio), lte: endOfDay(dataFim) }`.
  - Apenas `dataInicio` → `{ gte: startOfDay(dataInicio) }`.
  - Apenas `dataFim` → `{ lte: endOfDay(dataFim) }`.
  - Se `dataInicio` ou `dataFim` estiver presente junto com `data`, o período (`dataInicio`/`dataFim`) tem precedência.
- **Exemplo:**
  ```ts
  const intervalo = resolverIntervaloDatasDashboard({
    dataInicio: "2026-11-01",
    dataFim: "2026-11-30",
  });
  ```

---

### `montarWhereDashboard(filtros?, opcoes?)`

- **Assinatura:**
  ```ts
  export type CampoDataDashboard = "criadoEm" | "encerradoEm";

  export interface OpcoesWhereDashboard {
    campoData?: CampoDataDashboard;
    base?: Prisma.TicketWhereInput;
  }

  export function montarWhereDashboard(
    filtros?: FiltrosDashboard,
    opcoes?: OpcoesWhereDashboard,
  ): Prisma.TicketWhereInput
  ```
- **Import:** `import { montarWhereDashboard } from "@/services/dashboard.service";`
- **Objetivo:** Construir de forma padronizada e reutilizável o objeto `where` do Prisma para `Ticket`, combinando todos os filtros do dashboard com um filtro `base` opcional.
- **Para agentes/devs implementando SLA e Duração Real:** reutilize esta função diretamente para garantir que os filtros de equipe, usuário, projeto, cliente e data funcionem de forma idêntica em todo o dashboard.
- **Regras e edge cases:**
  - `opcoes.campoData` padrão é `"criadoEm"`; passe `"encerradoEm"` para consultas baseadas em data de encerramento.
  - Se `base` e os filtros não compartilham chaves, retorna um objeto plano `{ ...base, ...filtrosWhere }`.
  - Se houver colisão de chaves entre `base` e os filtros (por exemplo, ambos usarem `OR` ou `criadoEm`), encapsula automaticamente em `{ AND: [base, filtrosWhere] }` para nunca sobrescrever condições.
- **Exemplo (reutilização em consulta de SLA):**
  ```ts
  const whereForaDoSla = montarWhereDashboard(filtros, {
    base: {
      status: { not: StatusTicket.ENCERRADO },
      slaEm: { lt: new Date() },
    },
  });
  ```

---

### Classe `ServicoDashboard` e instância `servicoDashboard`

- **Import:** `import { ServicoDashboard, servicoDashboard } from "@/services/dashboard.service";`
- **Construtor:** `new ServicoDashboard(db: PrismaClient = prisma)`
  - Em produção/endpoints, utilize o singleton `servicoDashboard`.
  - Em testes unitários, instancie `new ServicoDashboard(bancoMock)` para injetar mocks sem tocar no banco real.

---

### `servicoDashboard.contarChamadosCriados(filtros?)`

- **Assinatura:**
  ```ts
  async contarChamadosCriados(filtros?: FiltrosDashboard): Promise<number>
  ```
- **Alimenta:** Indicador *"Quantidade de chamados criados"* / card *"Total de tickets"*.
- **Consulta executada:** `prisma.ticket.count({ where })` com `campoData: "criadoEm"`.
- **Retorno:** Número inteiro (`>= 0`).
- **Exemplo:**
  ```ts
  const totalCriados = await servicoDashboard.contarChamadosCriados({
    clienteId,
    dataInicio: "2026-11-01",
    dataFim: "2026-11-30",
  });
  ```

---

### `servicoDashboard.contarChamadosFechados(filtros?)`

- **Assinatura:**
  ```ts
  async contarChamadosFechados(filtros?: FiltrosDashboard): Promise<number>
  ```
- **Alimenta:** Indicador *"Quantidade de chamados fechados"*.
- **Consulta executada:** `prisma.$transaction` executando `CALL sp_contar_chamados_fechados(equipeId, usuarioId, projetoId, clienteId, dataInicio, dataFim, @total_chamados_fechados)` (Stored Procedure criada na migration `20261122115500_sp_contar_chamados_fechados`) seguido de `SELECT @total_chamados_fechados AS total` na mesma conexão.
- **Regras e edge cases:**
  - Com filtro de data: conta apenas tickets encerrados dentro do período (`encerradoEm` no intervalo).
  - Sem filtro de data: não restringe `encerradoEm`, contando todos os tickets com `status = ENCERRADO` que atendem aos demais filtros.
- **Retorno:** Número inteiro (`>= 0`).
- **Exemplo:**
  ```ts
  const totalFechados = await servicoDashboard.contarChamadosFechados({
    equipeId,
    dataInicio: "2026-11-01",
    dataFim: "2026-11-30",
  });
  ```

---

### `servicoDashboard.agruparPorStatus(filtros?)`

- **Assinatura:**
  ```ts
  async agruparPorStatus(
    filtros?: FiltrosDashboard,
  ): Promise<AgregacaoStatusDashboard>
  ```
- **Alimenta:** Gráfico de rosca *"Tickets por Status"*, card *"Encerramento solicitado"* e contagem base de volume.
- **Consulta executada:** `prisma.ticket.groupBy({ by: ["status"], where, _count: { _all: true } })` com `campoData: "criadoEm"`.
- **Regras e edge cases:**
  - Sempre retorna os 5 status na ordem `NAO_INICIADO`, `EM_ANDAMENTO`, `SOLICITACAO_ENCERRAMENTO`, `EM_REVISAO`, `ENCERRADO`.
  - Status sem registros retornam com `quantidade: 0`.
  - `abertos` é calculado como `total - encerrados`.
- **Exemplo de retorno:**
  ```json
  {
    "total": 25,
    "abertos": 16,
    "encerramentoSolicitado": 4,
    "itens": [
      { "status": "NAO_INICIADO", "label": "Não iniciado", "quantidade": 0 },
      { "status": "EM_ANDAMENTO", "label": "Em andamento", "quantidade": 12 },
      { "status": "SOLICITACAO_ENCERRAMENTO", "label": "Encerramento solicitado", "quantidade": 4 },
      { "status": "EM_REVISAO", "label": "Em revisão", "quantidade": 0 },
      { "status": "ENCERRADO", "label": "Encerrado", "quantidade": 9 }
    ]
  }
  ```

---

### `servicoDashboard.agruparAbertosPorEquipe(filtros?)`

- **Assinatura:**
  ```ts
  async agruparAbertosPorEquipe(
    filtros?: FiltrosDashboard,
  ): Promise<AgregacaoAbertosPorEquipeDashboard>
  ```
- **Alimenta:** Gráfico de barras *"Tickets abertos por equipe"* (número principal + barra por equipe).
- **Consultas executadas:**
  1. `prisma.ticket.count({ where: whereTicketAberto })` — calcula `totalAbertos` (tickets distintos com `status != ENCERRADO`).
  2. `prisma.$queryRaw` utilizando a Stored Function MySQL **`fn_contar_abertos_equipe(e.id, usuarioId, projetoId, clienteId, dataInicio, dataFim)`** (criada na migration `20261122114000_fn_contar_abertos_equipe`), que faz `INNER JOIN` entre `ticket_equipes`, `tickets` e `projetos` (e `EXISTS` em `historico_ticket` quando `usuarioId` é informado) para contar chamados abertos por equipe.
- **Regras e edge cases:**
  - **Todas as equipes (`equipeId` ausente):** inclui todas as equipes ativas (mesmo com `quantidade: 0`) e também equipes inativas que ainda possuam tickets abertos no recorte.
  - **Equipe específica (`equipeId` informado):** filtra `ticketEquipe` também por `equipeId`, evitando exibir outras equipes que compartilhem o mesmo ticket alocado. Se o `equipeId` não existir no banco, `equipes` retorna `[]`.
  - **Multi-equipe:** a soma de `equipes[].quantidade` pode ser maior que `totalAbertos` quando um mesmo ticket está alocado a mais de uma equipe.
- **Exemplo de retorno:**
  ```json
  {
    "totalAbertos": 7,
    "equipes": [
      { "equipeId": "uuid-a", "nome": "Equipe A", "quantidade": 5 },
      { "equipeId": "uuid-b", "nome": "Equipe B", "quantidade": 0 },
      { "equipeId": "uuid-c", "nome": "Equipe C", "quantidade": 3 }
    ]
  }
  ```

---

### `servicoDashboard.agruparPorUrgencia(filtros?)`

- **Assinatura:**
  ```ts
  async agruparPorUrgencia(
    filtros?: FiltrosDashboard,
  ): Promise<AgregacaoUrgenciaDashboard>
  ```
- **Alimenta:** Gráfico de barras horizontais *"Tickets por urgência"* / indicador *"Quantidade de chamados por urgência"*.
- **Consulta executada:** `prisma.ticket.groupBy({ by: ["prioridade"], where, _count: { _all: true } })` com `campoData: "criadoEm"`.
- **Regras e edge cases:**
  - Sempre retorna os 4 níveis em ordem decrescente de severidade: `CRITICA`, `ALTA`, `MEDIA`, `BAIXA`.
  - Níveis sem chamados no recorte retornam `quantidade: 0`.
- **Exemplo de retorno:**
  ```json
  {
    "total": 10,
    "itens": [
      { "prioridade": "CRITICA", "label": "Crítica", "quantidade": 3 },
      { "prioridade": "ALTA", "label": "Alta", "quantidade": 0 },
      { "prioridade": "MEDIA", "label": "Média", "quantidade": 0 },
      { "prioridade": "BAIXA", "label": "Baixa", "quantidade": 7 }
    ]
  }
  ```

---

### `classificarFaixaSla(criadoEm, slaEm)`

- **Assinatura:**
  ```ts
  export function classificarFaixaSla(
    criadoEm: Date,
    slaEm: Date,
  ): FaixaSlaDashboard
  ```
- **Import:** `import { classificarFaixaSla } from "@/services/dashboard.service";`
- **Objetivo:** Classificar o prazo estimado do ticket (`slaEm - criadoEm`) em uma das 6 faixas do gráfico *"Tickets por SLA"*: `"4h"`, `"8h"`, `"1d"`, `"2d"`, `"3d"` ou `"7d"`.
- **Regras e tolerância:**
  - Aplica tolerância de cadastro de **5 minutos** (alinhada a `src/lib/sla-alert-window.ts`) para compensar a diferença entre o cálculo de `slaEm` no cliente e o registro de `criadoEm` no MySQL.
  - Faixas: `<= 4h` → `"4h"`; `<= 8h` → `"8h"`; `<= 1 dia` → `"1d"`; `<= 2 dias` → `"2d"`; `<= 3 dias` → `"3d"`; acima de `3 dias` → `"7d"`.

---

### `servicoDashboard.agruparPorSla(filtros?)`

- **Assinatura:**
  ```ts
  async agruparPorSla(
    filtros?: FiltrosDashboard,
  ): Promise<AgregacaoSlaDashboard>
  ```
- **Alimenta:** Gráfico de pizza *"Tickets por SLA"* (`4 horas`, `8 horas`, `1 dia`, `2 dias`, `3 dias`, `7 dias`).
- **Consulta executada:** `prisma.ticket.findMany({ where, select: { criadoEm: true, slaEm: true } })` com `campoData: "criadoEm"`.
- **Regras e edge cases:**
  - Sempre retorna as 6 faixas na ordem `4h`, `8h`, `1d`, `2d`, `3d`, `7d`.
  - Faixas sem chamados no recorte retornam `quantidade: 0`.
  - `total` corresponde à soma de todas as faixas (todos os tickets do recorte filtrado).
- **Exemplo de retorno:**
  ```json
  {
    "total": 6,
    "itens": [
      { "sla": "4h", "label": "4 horas", "quantidade": 2 },
      { "sla": "8h", "label": "8 horas", "quantidade": 1 },
      { "sla": "1d", "label": "1 dia", "quantidade": 1 },
      { "sla": "2d", "label": "2 dias", "quantidade": 0 },
      { "sla": "3d", "label": "3 dias", "quantidade": 1 },
      { "sla": "7d", "label": "7 dias", "quantidade": 1 }
    ]
  }
  ```

---

### `servicoDashboard.contarResumoSla(filtros?, agora?)`

- **Assinatura:**
  ```ts
  async contarResumoSla(
    filtros?: FiltrosDashboard,
    agora?: Date,
  ): Promise<ResumoSlaDashboard>
  ```
- **Alimenta:** Cards KPI *"Fora do SLA"* e *"Próximo do SLA"*.
- **Regras:**
  - `foraDoSla`: tickets abertos com `slaEm <= agora` ou tickets encerrados com `encerradoEm > slaEm`.
  - `proximoDoSla`: tickets abertos ainda dentro do prazo (`slaEm > agora`) cujo tempo restante é menor ou igual à janela de alerta de `janelaAlertaSlaMs(criadoEm, slaEm)` (`src/lib/sla-alert-window.ts`).

---

### `servicoDashboard.agruparSlaEstimadoVsReal(filtros?)`

- **Assinatura:**
  ```ts
  async agruparSlaEstimadoVsReal(
    filtros?: FiltrosDashboard,
  ): Promise<AgregacaoSlaEstimadoVsRealDashboard>
  ```
- **Alimenta:** Gráfico de barras agrupadas *"Tickets encerrados: Dentro do SLA vs. Fora do SLA"* (`4 horas`, `8 horas`, `1 dia`, `2 dias`, `3 dias`, `7 dias`).
- **Regras:**
  - Considera apenas tickets encerrados (`status = ENCERRADO` e `encerradoEm != null`), classificados pela faixa de SLA estimado (`classificarFaixaSla(criadoEm, slaEm)`).
  - `dentroDoSla` (legenda *"SLA Estimado"*): encerrados dentro do prazo (`encerradoEm <= slaEm`).
  - `atrasado` (legenda *"SLA Atrasado"*): encerrados após o prazo (`encerradoEm > slaEm`).

---

### `servicoDashboard.obterAgregacoesVolumeStatusUrgencia(filtros?, agora?)`

- **Assinatura:**
  ```ts
  async obterAgregacoesVolumeStatusUrgencia(
    filtros?: FiltrosDashboard,
    agora?: Date,
  ): Promise<AgregacoesVolumeStatusUrgenciaDashboard>
  ```
- **Alimenta:** Página do dashboard e endpoint principal (todas as agregações em uma única chamada).
- **Otimização interna:**
  - Executa em paralelo (`Promise.all`): `agruparPorStatus`, `contarChamadosFechados`, agrupamento de equipes abertas, `agruparPorUrgencia` e uma única leitura `ticket.findMany` (`status`, `criadoEm`, `slaEm`, `encerradoEm`) da qual deriva `porSla`, `resumoSla` e `slaEstimadoVsReal`.
  - Deriva `volume.criados`, `volume.abertos`, `volume.encerramentoSolicitado` e `abertosPorEquipe.totalAbertos` diretamente do `groupBy` de status, evitando chamadas extras a `ticket.count`.
- **Estrutura de retorno (`AgregacoesVolumeStatusUrgenciaDashboard`):**
  ```json
  {
    "volume": {
      "criados": 28,
      "fechados": 11,
      "abertos": 20,
      "encerramentoSolicitado": 3
    },
    "porStatus": {
      "total": 28,
      "abertos": 20,
      "encerramentoSolicitado": 3,
      "itens": [
        { "status": "NAO_INICIADO", "label": "Não iniciado", "quantidade": 5 },
        { "status": "EM_ANDAMENTO", "label": "Em andamento", "quantidade": 10 },
        { "status": "SOLICITACAO_ENCERRAMENTO", "label": "Encerramento solicitado", "quantidade": 3 },
        { "status": "EM_REVISAO", "label": "Em revisão", "quantidade": 2 },
        { "status": "ENCERRADO", "label": "Encerrado", "quantidade": 8 }
      ]
    },
    "abertosPorEquipe": {
      "totalAbertos": 20,
      "equipes": [
        { "equipeId": "uuid-a", "nome": "Equipe A", "quantidade": 12 },
        { "equipeId": "uuid-b", "nome": "Equipe B", "quantidade": 8 }
      ]
    },
    "porUrgencia": {
      "total": 28,
      "itens": [
        { "prioridade": "CRITICA", "label": "Crítica", "quantidade": 4 },
        { "prioridade": "ALTA", "label": "Alta", "quantidade": 9 },
        { "prioridade": "MEDIA", "label": "Média", "quantidade": 10 },
        { "prioridade": "BAIXA", "label": "Baixa", "quantidade": 5 }
      ]
    },
    "porSla": {
      "total": 28,
      "itens": [
        { "sla": "4h", "label": "4 horas", "quantidade": 6 },
        { "sla": "8h", "label": "8 horas", "quantidade": 5 },
        { "sla": "1d", "label": "1 dia", "quantidade": 7 },
        { "sla": "2d", "label": "2 dias", "quantidade": 4 },
        { "sla": "3d", "label": "3 dias", "quantidade": 3 },
        { "sla": "7d", "label": "7 dias", "quantidade": 3 }
      ]
    },
    "resumoSla": {
      "foraDoSla": 4,
      "proximoDoSla": 3
    },
    "slaEstimadoVsReal": {
      "totalDentroDoSla": 6,
      "totalAtrasado": 2,
      "itens": [
        { "sla": "4h", "label": "4 horas", "dentroDoSla": 2, "atrasado": 1 },
        { "sla": "8h", "label": "8 horas", "dentroDoSla": 1, "atrasado": 0 },
        { "sla": "1d", "label": "1 dia", "dentroDoSla": 1, "atrasado": 1 },
        { "sla": "2d", "label": "2 dias", "dentroDoSla": 1, "atrasado": 0 },
        { "sla": "3d", "label": "3 dias", "dentroDoSla": 0, "atrasado": 0 },
        { "sla": "7d", "label": "7 dias", "dentroDoSla": 1, "atrasado": 0 }
      ]
    }
  }
  ```

---

## 3. Camada de Acesso a Dados Next.js (`src/lib/data/dashboard.ts`)

Wrappers server-side para Server Components (`app/(app-content)/.../page.tsx`), seguindo o mesmo padrão de `src/lib/data/tickets.ts` e `src/lib/data/equipe.ts`: registram o erro original no servidor (`console.error`) e lançam um `Error` com mensagem amigável em português em caso de falha de banco.

| Função | Delega para | Retorno | Mensagem de erro em caso de falha |
| --- | --- | --- | --- |
| `getAgregacoesDashboard(filtros?)` | `servicoDashboard.obterAgregacoesVolumeStatusUrgencia` | `Promise<AgregacoesVolumeStatusUrgenciaDashboard>` | `"Não foi possível carregar os indicadores do dashboard."` |
| `getChamadosCriados(filtros?)` | `servicoDashboard.contarChamadosCriados` | `Promise<number>` | `"Não foi possível contar os chamados criados."` |
| `getChamadosFechados(filtros?)` | `servicoDashboard.contarChamadosFechados` | `Promise<number>` | `"Não foi possível contar os chamados fechados."` |
| `getTicketsPorStatus(filtros?)` | `servicoDashboard.agruparPorStatus` | `Promise<AgregacaoStatusDashboard>` | `"Não foi possível carregar os chamados por status."` |
| `getTicketsAbertosPorEquipe(filtros?)` | `servicoDashboard.agruparAbertosPorEquipe` | `Promise<AgregacaoAbertosPorEquipeDashboard>` | `"Não foi possível carregar os chamados abertos por equipe."` |
| `getTicketsPorUrgencia(filtros?)` | `servicoDashboard.agruparPorUrgencia` | `Promise<AgregacaoUrgenciaDashboard>` | `"Não foi possível carregar os chamados por urgência."` |
| `getTicketsPorSla(filtros?)` | `servicoDashboard.agruparPorSla` | `Promise<AgregacaoSlaDashboard>` | `"Não foi possível carregar os chamados por SLA."` |
| `getResumoSla(filtros?)` | `servicoDashboard.contarResumoSla` | `Promise<ResumoSlaDashboard>` | `"Não foi possível carregar o resumo de SLA."` |
| `getSlaEstimadoVsReal(filtros?)` | `servicoDashboard.agruparSlaEstimadoVsReal` | `Promise<AgregacaoSlaEstimadoVsRealDashboard>` | `"Não foi possível carregar o comparativo de SLA estimado vs tempo real."` |

- **Import:** `import { getAgregacoesDashboard } from "@/lib/data/dashboard";`

---

## 4. Guia Rápido de Integração

### Em um Controller / Route Handler (`GET /api/dashboard`)

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { exigirSessao } from "@/auth/exigir-cargo";
import { validarFiltrosDashboard } from "@/schemas/dashboard.schema";
import { servicoDashboard } from "@/services/dashboard.service";

export async function GET(requisicao: Request) {
  const acesso = await exigirSessao(requisicao);
  if (!acesso.autorizado) return acesso.resposta;

  const validacao = validarFiltrosDashboard(
    new URL(requisicao.url).searchParams,
  );
  if (!validacao.success) {
    return NextResponse.json(
      {
        erro: "Parâmetros de filtro inválidos.",
        detalhes: z.flattenError(validacao.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const dados = await servicoDashboard.obterAgregacoesVolumeStatusUrgencia(
      validacao.data,
    );
    return NextResponse.json(dados, { status: 200 });
  } catch (erro) {
    console.error("[GET /api/dashboard] Erro ao carregar agregações:", erro);
    return NextResponse.json(
      { erro: "Erro interno ao carregar indicadores do dashboard." },
      { status: 500 },
    );
  }
}
```

### Em um Server Component Next.js

```ts
import { validarFiltrosDashboard } from "@/schemas/dashboard.schema";
import { getAgregacoesDashboard } from "@/lib/data/dashboard";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const validacao = validarFiltrosDashboard(await searchParams);
  const filtros = validacao.success ? validacao.data : undefined;
  const dados = await getAgregacoesDashboard(filtros);
  // Renderizar cards e gráficos com `dados.volume`, `dados.porStatus`,
  // `dados.abertosPorEquipe` e `dados.porUrgencia`.
}
```
