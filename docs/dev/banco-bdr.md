# Usar o banco `bdr_api` (3ª avaliação de BDR — Parte 5)

O banco `bdr_api` (repositório BDR-2026.02, scripts `sql/01..06`) tem as mesmas tabelas
do Prisma, mais regras no banco: functions, procedures e triggers. A API pode apontar
para ele só por variáveis de ambiente.

## O que muda quando liga

| Variável | Efeito |
|---|---|
| `USAR_ROTINAS_BDR=true` | `POST /api/tickets` chama `CALL sp_abrir_ticket(...)` em vez do `ticket.create` do Prisma. A procedure valida o cargo, o projeto e o cliente e o prazo, grava o ticket, a equipe do projeto, o histórico `TICKET_CRIADO` e a atividade da conta numa transação, e sugere o técnico responsável. As equipes extras do formulário são adicionadas depois. `GET /api/tickets`, `GET /api/tickets/:id` e a tela `/tickets` passam a trazer `situacaoSla` (`NO_PRAZO`, `EM_ALERTA`, `VENCIDO`, `CUMPRIDO`, `VIOLADO`), calculado por `fn_situacao_sla(id)`. O card do ticket mostra esse indicador. |
| `MYSQL_SESSION_TIME_ZONE=+00:00` | Fuso da sessão MySQL. O Prisma grava `DateTime` em UTC, e o servidor do bdr_api roda em `-03:00`. Com a sessão em UTC, o `NOW()` das rotinas fica no mesmo referencial das datas que a API grava. |

Se a regra da procedure recusar o pedido (`SIGNAL SQLSTATE '45000'`), a API responde **422**
com a mensagem do banco, por exemplo `{"erro":"O cargo do usuário não permite abrir tickets."}`.

Sem essas variáveis nada muda, e o banco de dev (porta 3307) continua funcionando como antes.

Código: `src/services/bdr-rotinas.ts` (CALL e SELECT da function), `src/services/ticket.service.ts`
(`criar`, `listarTodos`, `buscarDetalhePorId`), `src/components/tickets/ticket-card.tsx` (indicador).

## Como rodar

1. Crie o banco no MySQL 8: no repositório BDR, rode
   `MYSQL="mysql -uroot -h127.0.0.1 -P3399" ./scripts/rodar_tudo.sh`.
2. Crie `src/.env` (ou exporte as variáveis):

   ```sh
   MYSQL_HOST=127.0.0.1
   MYSQL_PORT=3399
   MYSQL_USER=root
   MYSQL_PASSWORD=
   MYSQL_DATABASE=bdr_api
   DATABASE_URL="mysql://root@127.0.0.1:3399/bdr_api"
   SESSION_SECRET="qualquer-valor-com-32-caracteres-ou-mais"
   USAR_ROTINAS_BDR=true
   MYSQL_SESSION_TIME_ZONE=+00:00
   ```

3. Rode `npm run dev`. **Não** rode `prisma migrate` contra o bdr_api, porque o schema dele
   vem dos scripts do BDR.
4. Entre como um usuário que pode abrir ticket (SUPORTE ou GESTOR do projeto), por exemplo
   com `POST /api/dev/sessao {"usuarioId":"<uuid>"}`, e crie um ticket com `POST /api/tickets`.
