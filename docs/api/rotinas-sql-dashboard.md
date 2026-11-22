# Guia de Estudo e Apresentação — Stored Function e Stored Procedure no Dashboard

Material preparado para estudo e apresentação das duas rotinas SQL criadas no MySQL 8 e integradas ao backend Next.js/Prisma do Dashboard.

---

## 1. Diferença entre Stored Function e Stored Procedure

Essa é a pergunta mais comum em apresentações de banco de dados. Tenha a comparação na ponta da língua:

| Característica | Stored Function (`fn_contar_abertos_equipe`) | Stored Procedure (`sp_contar_chamados_fechados`) |
| --- | --- | --- |
| **Como é chamada no SQL** | Dentro de uma expressão (`SELECT`, `WHERE`, `ORDER BY`) | De forma isolada com `CALL nome_procedure(...)` |
| **Retorno** | Sempre retorna **1 valor escalar** (`RETURNS INT`) | Não tem `RETURNS`; devolve resultados via parâmetro **`OUT`** (ou result sets) |
| **Parâmetros** | Somente entrada (`IN` implícito) | Suporta **`IN`**, **`OUT`** e **`INOUT`** |
| **Uso no projeto** | Chamada **para cada equipe** dentro de um `SELECT` em `equipes` | Chamada **uma vez** para calcular o total filtrado e gravar em `@total_chamados_fechados` |
| **Onde está a migration** | `src/prisma/migrations/20261122114000_fn_contar_abertos_equipe/migration.sql` | `src/prisma/migrations/20261122115500_sp_contar_chamados_fechados/migration.sql` |
| **Onde é chamada no código** | `ServicoDashboard.buscarEquipesAbertas` (`src/services/dashboard.service.ts`) | `ServicoDashboard.contarChamadosFechados` (`src/services/dashboard.service.ts`) |

---

## 2. Fluxo Geral no Sistema

```
Página Dashboard (Next.js Server Component)
  └─> getAgregacoesDashboard(filtros)         [src/lib/data/dashboard.ts]
        └─> ServicoDashboard                  [src/services/dashboard.service.ts]
              ├─> buscarEquipesAbertas()      ── $queryRaw ──> fn_contar_abertos_equipe(...)
              └─> contarChamadosFechados()    ── $transaction ($executeRaw + $queryRaw) ──> CALL sp_contar_chamados_fechados(..., @total)
```

Ambas as rotinas respeitam **todos os 6 filtros do dashboard**:
1. Equipe (`equipeId`, ou todas as equipes quando `NULL`)
2. Usuário (`usuarioId`)
3. Projeto (`projetoId`)
4. Cliente (`clienteId`)
5. Data inicial (`dataInicio`)
6. Data final (`dataFim`)

---

## 3. Parte 1 — Stored Function: `fn_contar_abertos_equipe`

### Objetivo no produto
Alimentar o gráfico de barras **"Tickets abertos por equipe"**, retornando quantos tickets em aberto (`status <> 'ENCERRADO'`) estão alocados a uma determinada equipe, respeitando os filtros selecionados na tela.

### Código SQL (`migration.sql`)

```sql
DROP FUNCTION IF EXISTS fn_contar_abertos_equipe;

CREATE FUNCTION fn_contar_abertos_equipe(
  p_equipe_id CHAR(36),
  p_usuario_id CHAR(36),
  p_projeto_id CHAR(36),
  p_cliente_id CHAR(36),
  p_data_inicio DATETIME(3),
  p_data_fim DATETIME(3)
)
RETURNS INT
READS SQL DATA
RETURN (
  SELECT COUNT(*)
  FROM ticket_equipes te
  INNER JOIN tickets t ON t.id = te.ticket_id
  INNER JOIN projetos p ON p.id = t.projeto_id
  WHERE te.equipe_id = p_equipe_id
    AND t.status <> 'ENCERRADO'
    AND (p_projeto_id IS NULL OR t.projeto_id = p_projeto_id)
    AND (p_cliente_id IS NULL OR p.cliente_id = p_cliente_id)
    AND (p_data_inicio IS NULL OR t.criado_em >= p_data_inicio)
    AND (p_data_fim IS NULL OR t.criado_em <= p_data_fim)
    AND (
      p_usuario_id IS NULL
      OR t.aberto_por_id = p_usuario_id
      OR t.responsavel_id = p_usuario_id
      OR EXISTS (
        SELECT 1
        FROM historico_ticket h
        WHERE h.ticket_id = t.id
          AND h.usuario_id = p_usuario_id
      )
    )
);
```

### Explicação ponto a ponto (para explicar na hora)

1. **`DROP FUNCTION IF EXISTS`**: garante idempotência se o script precisar ser reaplicado.
2. **Parâmetros (`CHAR(36)` e `DATETIME(3)`)**: batem exatamente com os tipos das colunas no `schema.prisma` (UUIDs em `CHAR(36)` e datas com milissegundos em `DATETIME(3)`).
3. **`RETURNS INT` e `READS SQL DATA`**:
   - Informa ao MySQL que o retorno é um inteiro e que a função apenas **lê** dados (não altera tabelas).
   - No MySQL 8 com *binary logging* ativado (padrão no Docker), omitir `READS SQL DATA` / `DETERMINISTIC` / `NO SQL` gera erro (`ERROR 1418`).
4. **Uso da tabela associativa (*junction table*) `ticket_equipes`**:
   - Um ticket pode ser atendido por **mais de uma equipe** (relacionamento N:N).
   - Por isso a consulta parte de `ticket_equipes te` com `INNER JOIN tickets t` (para filtrar status e datas) e `INNER JOIN projetos p` (para alcançar `cliente_id`).
5. **Filtros opcionais com `(param IS NULL OR coluna = param)`**:
   - Quando um filtro não foi escolhido no dashboard, enviamos `NULL` e a condição é ignorada automaticamente.
6. **Por que `EXISTS` em `historico_ticket` em vez de `JOIN`?**
   - Um ticket pode ter 10 registros de log feitos pelo mesmo usuário. Um `LEFT JOIN historico_ticket` multiplicaria o ticket por 10 no `COUNT(*)`.
   - Com `EXISTS (SELECT 1 FROM historico_ticket ...)`, o banco só verifica se o usuário atuou ao menos uma vez naquele ticket — **sem duplicar a contagem**.

### Como o backend chama a Function (`buscarEquipesAbertas`)

Em `src/services/dashboard.service.ts`:

```ts
const linhas = await this.db.$queryRaw<
  Array<{ equipeId: string; nome: string; quantidade: bigint | number }>
>`
  SELECT equipeId, nome, quantidade
  FROM (
    SELECT
      e.id AS equipeId,
      e.nome AS nome,
      e.ativo AS ativo,
      fn_contar_abertos_equipe(
        e.id,
        ${usuarioId},
        ${projetoId},
        ${clienteId},
        ${dataInicio},
        ${dataFim}
      ) AS quantidade
    FROM equipes e
    ${filtroEquipe}
  ) AS resumo_equipes
  ${filtroVisibilidade}
  ORDER BY nome ASC
`;
```

**Destaques para comentar:**
- **Subconsulta (`resumo_equipes`)**: calcula `fn_contar_abertos_equipe(...)` uma única vez por equipe e permite filtrar `WHERE ativo = TRUE OR quantidade > 0` na consulta externa (assim equipes ativas com `0` chamados continuam aparecendo no gráfico, e equipes inativas que ainda tenham chamados abertos não somem).
- **Filtro de equipe única**: quando `equipeId` é selecionado, `filtroEquipe` aplica `WHERE e.id = ${equipeId}` e a função só é avaliada para aquela equipe.
- **Segurança contra SQL Injection**: o *tagged template* `` $queryRaw`...` `` e `Prisma.sql` transformam cada `${valor}` em parâmetro preparado (`?`), nunca concatenando texto cru na query.
- **Conversão `Number(linha.quantidade)`**: evita erro de serialização caso o driver MariaDB/MySQL retorne `BigInt`.

### Como testar direto no MySQL (DBeaver ou terminal)

```sql
-- Contar chamados abertos de todas as equipes ativas (sem filtros extras)
SELECT
  e.id,
  e.nome,
  fn_contar_abertos_equipe(e.id, NULL, NULL, NULL, NULL, NULL) AS abertos
FROM equipes e
WHERE e.ativo = TRUE
ORDER BY e.nome;

-- Testar uma equipe específica filtrando por período
SELECT fn_contar_abertos_equipe(
  '<UUID_DA_EQUIPE>',
  NULL,
  NULL,
  NULL,
  '2026-11-01 00:00:00.000',
  '2026-11-30 23:59:59.999'
) AS total_abertos;
```

---

## 4. Parte 2 — Stored Procedure: `sp_contar_chamados_fechados`

### Objetivo no produto
Calcular o indicador **"Quantidade de chamados fechados"** (`volume.fechados`), contando quantos tickets foram encerrados (`status = 'ENCERRADO'`) dentro do período filtrado (`encerrado_em`), respeitando todos os filtros do dashboard.

### Código SQL (`migration.sql`)

```sql
DROP PROCEDURE IF EXISTS sp_contar_chamados_fechados;

CREATE PROCEDURE sp_contar_chamados_fechados(
  IN p_equipe_id CHAR(36),
  IN p_usuario_id CHAR(36),
  IN p_projeto_id CHAR(36),
  IN p_cliente_id CHAR(36),
  IN p_data_inicio DATETIME(3),
  IN p_data_fim DATETIME(3),
  OUT p_total INT
)
SELECT COUNT(*)
INTO p_total
FROM tickets t
INNER JOIN projetos p ON p.id = t.projeto_id
WHERE t.status = 'ENCERRADO'
  AND (p_projeto_id IS NULL OR t.projeto_id = p_projeto_id)
  AND (p_cliente_id IS NULL OR p.cliente_id = p_cliente_id)
  AND (p_data_inicio IS NULL OR t.encerrado_em >= p_data_inicio)
  AND (p_data_fim IS NULL OR t.encerrado_em <= p_data_fim)
  AND (
    p_equipe_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM ticket_equipes te
      WHERE te.ticket_id = t.id
        AND te.equipe_id = p_equipe_id
    )
  )
  AND (
    p_usuario_id IS NULL
    OR t.aberto_por_id = p_usuario_id
    OR t.responsavel_id = p_usuario_id
    OR EXISTS (
      SELECT 1
      FROM historico_ticket h
      WHERE h.ticket_id = t.id
        AND h.usuario_id = p_usuario_id
    )
  );
```

### Explicação ponto a ponto (para explicar na hora)

1. **Parâmetros `IN` e `OUT`**:
   - Os 6 primeiros são `IN` (recebem os filtros opcionais).
   - O 7º é **`OUT p_total INT`** (recebe o resultado calculado pelo `SELECT COUNT(*) INTO p_total`).
2. **Por que filtra `t.encerrado_em` e não `t.criado_em`?**
   - Se um chamado foi aberto em outubro e fechado em novembro, quando o gestor filtra novembro ele quer saber quantos chamados foram **fechados em novembro**. Por isso o período de data usa `encerrado_em`.
3. **Por que `EXISTS` em `ticket_equipes` aqui?**
   - Na contagem total de chamados fechados, um ticket alocado a 2 equipes deve ser contado **apenas 1 vez** (se fizéssemos `JOIN ticket_equipes` direto sem `DISTINCT`, ele contaria em dobro). O `EXISTS` garante contagem exata de tickets distintos.

### Como o backend chama a Procedure (`contarChamadosFechados`)

Em `src/services/dashboard.service.ts`:

```ts
return this.db.$transaction(async (tx) => {
  await tx.$executeRaw`
    CALL sp_contar_chamados_fechados(
      ${equipeId},
      ${usuarioId},
      ${projetoId},
      ${clienteId},
      ${dataInicio},
      ${dataFim},
      @total_chamados_fechados
    )
  `;

  const [linha] = await tx.$queryRaw<Array<{ total: bigint | number }>>`
    SELECT @total_chamados_fechados AS total
  `;

  return Number(linha?.total ?? 0);
});
```

**Destaques técnicos (ótimos para explicar na apresentação):**
1. **Por que usar `$transaction`?**
   - Variáveis de sessão no MySQL (`@total_chamados_fechados`) pertencem à **conexão atual**.
   - Com pool de conexões, executar `CALL` e `SELECT @...` fora de uma transação poderia cair em conexões diferentes e retornar `NULL` ou o valor de outro usuário.
   - O `this.db.$transaction` fixa a **mesma conexão MySQL** para os dois comandos.
2. **Por que usar parâmetro `OUT` + `$executeRaw` em vez de `SELECT` direto na Procedure?**
   - O driver `@prisma/adapter-mariadb` usado no Prisma 7 espera um único *result set* plano no `queryRaw`. Procedures que retornam `SELECT` direto fazem o MySQL devolver um pacote duplo (`[rows, OkPacket]`), o que quebra o mapeamento de metadados do adapter.
   - Gravando o resultado no parâmetro `OUT` (`SELECT COUNT(*) INTO p_total`) e lendo com `SELECT @total_chamados_fechados AS total`, a integração com Prisma 7 + MariaDB funciona 100% estável.

### Como testar direto no MySQL (DBeaver ou terminal)

```sql
-- Chamar sem filtros (todos os chamados encerrados)
CALL sp_contar_chamados_fechados(NULL, NULL, NULL, NULL, NULL, NULL, @total);
SELECT @total AS chamados_fechados;

-- Chamar filtrando por período de encerramento
CALL sp_contar_chamados_fechados(
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-11-01 00:00:00.000',
  '2026-11-30 23:59:59.999',
  @total
);
SELECT @total AS chamados_fechados_novembro;
```

---

## 5. Detalhe Técnico Extra: Por que não usamos `DELIMITER $$` nas migrations?

- `DELIMITER $$` é um comando exclusivo de clientes interativos (como o terminal `mysql` ou DBeaver), **não** faz parte da linguagem SQL do servidor MySQL.
- O **Prisma Migrate** envia o arquivo `migration.sql` diretamente para o servidor MySQL, então usar `DELIMITER` causa erro de sintaxe na migration.
- A solução adotada foi escrever tanto a Function (`RETURN (SELECT ...);`) quanto a Procedure (`SELECT COUNT(*) INTO p_total ...;`) com **corpo de instrução única** (sem `BEGIN ... END` e sem `;` internos). Assim elas funcionam perfeitamente tanto no `prisma migrate deploy` quanto no DBeaver/terminal!

---

## 6. Sugestão de Roteiro para Apresentação em Dupla (~5 minutos)

### Pessoa 1 — Contextualização + Stored Function (`fn_contar_abertos_equipe`)
1. **Contexto (30s):** mostrar o Dashboard rodando e apontar os dois pontos que usam rotinas SQL (o gráfico *"Tickets abertos por equipe"* e o indicador de chamados fechados).
2. **O que é uma Stored Function (30s):** retorna um valor escalar e pode ser usada dentro de `SELECT`.
3. **Explicar `fn_contar_abertos_equipe` (1m30s):**
   - Mostrar o arquivo `migration.sql`: `RETURNS INT`, `READS SQL DATA`, `INNER JOIN` na tabela associativa `ticket_equipes` + `tickets` + `projetos`, filtros opcionais com `IS NULL`, e `EXISTS` em `historico_ticket` para não duplicar contagem.
   - Mostrar `buscarEquipesAbertas` em `dashboard.service.ts`: como a subconsulta chama a função para cada equipe, mantém equipes ativas zeradas e converte `BigInt` com `Number(...)`.

### Pessoa 2 — Stored Procedure (`sp_contar_chamados_fechados`) + Diferenças + Testes
1. **O que é uma Stored Procedure (30s):** chamada via `CALL`, aceita parâmetros `IN` e `OUT`.
2. **Explicar `sp_contar_chamados_fechados` (1m30s):**
   - Mostrar o arquivo `migration.sql`: 6 parâmetros `IN` + `OUT p_total INT`, filtro por `status = 'ENCERRADO'` e `encerrado_em`, `EXISTS` na junction `ticket_equipes` para não duplicar tickets multi-equipe.
   - Mostrar `contarChamadosFechados` em `dashboard.service.ts`: explicar o uso de `$transaction` (mesma conexão para a variável `@total_chamados_fechados`) e a compatibilidade com o `@prisma/adapter-mariadb`.
3. **Fechamento (30s):**
   - Citar os cuidados de engenharia: migrations sem `DELIMITER`, proteção contra SQL Injection (`$queryRaw` / `$executeRaw` parametrizados) e testes unitários em `dashboard.service.test.ts` (`40/40` passando).

---

## 7. Perguntas Prováveis da Banca / Professor (e Respostas Curtas)

1. **"Qual a diferença prática entre a Function e a Procedure que vocês criaram?"**
   - A Function (`fn_contar_abertos_equipe`) retorna um número diretamente e é usada **dentro de um `SELECT`** sobre a tabela `equipes`, executando uma vez por equipe. A Procedure (`sp_contar_chamados_fechados`) é invocada com **`CALL`** e devolve o resultado por meio de um parâmetro **`OUT`**.
2. **"Por que vocês usaram `EXISTS` em vez de `JOIN` em `historico_ticket` (e em `ticket_equipes` na procedure)?"**
   - Porque um mesmo ticket pode ter vários registros de histórico ou várias equipes alocadas. Um `JOIN` direto multiplicaria as linhas e inflaria o `COUNT(*)`. O `EXISTS` verifica a existência da relação sem duplicar o ticket.
3. **"Por que o `contarChamadosFechados` usa `$transaction` se ele só está lendo dados?"**
   - Porque a procedure grava o resultado na variável de sessão `@total_chamados_fechados`. No pool de conexões, a transação garante que o `CALL` e o `SELECT @total_chamados_fechados` rodem na **mesma conexão MySQL**, evitando conflito entre requisições simultâneas.
4. **"Essas consultas SQL puras estão vulneráveis a SQL Injection?"**
   - Não. Usamos *tagged template literals* do Prisma (`` $queryRaw`...` ``, `` $executeRaw`...` `` e `Prisma.sql`), que transformam os valores interpolados em *prepared statements* (parâmetros `?`), separando código SQL de dados.
5. **"Por que converter o resultado com `Number(...)`?"**
   - Porque funções de agregação como `COUNT(*)` no MySQL/MariaDB podem chegar como `BigInt` no JavaScript, e o `JSON.stringify` / serialização do Next.js não serializa `BigInt`.

---

## 8. Checklist Rápido Antes da Apresentação

Na pasta `src/`:

```bash
# 1. Subir o MySQL (se estiver usando Docker)
docker compose up -d

# 2. Aplicar todas as migrations (incluindo a Function e a Procedure)
npx prisma migrate deploy --config prisma7.config.ts

# 3. Rodar os testes automatizados do dashboard
npx vitest run __tests__/schemas/dashboard.schema.test.ts __tests__/services/dashboard.service.test.ts __tests__/lib/dashboard.mapper.test.ts __tests__/data/dashboard.test.ts __tests__/lib/sla-alert-window.test.ts

# 4. Conferir se as duas rotinas existem no MySQL
# SHOW FUNCTION STATUS WHERE Db = DATABASE();
# SHOW PROCEDURE STATUS WHERE Db = DATABASE();
```
