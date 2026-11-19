# Alerta de SLA por e-mail

O gestor do projeto recebe um e-mail quando um ticket ativo se aproxima de `slaEm`. A janela depende do SLA escolhido:

| SLA | Enviar quando faltar |
| --- | --- |
| Mais de 1 dia | 1 dia |
| 1 dia | 4 horas |
| 8 horas | 2 horas |
| 4 horas | 1 hora |

A rotina identifica a duração original comparando `criadoEm` e `slaEm`, com até cinco minutos de tolerância para o tempo entre o cálculo no formulário e a gravação no banco. Tickets encerrados ou vencidos não geram alerta. Um registro em `alertas_sla` impede repetição para o mesmo ticket e prazo. Se o envio falhar, a reserva é removida para tentar novamente na próxima execução.

## Instalação

1. Aplique a migração: `npx prisma migrate deploy --config prisma7.config.ts` (na pasta `src`).
2. Configure `EMAIL_USER` e `EMAIL_PASS` no ambiente do servidor.
3. Para execução local, mantenha `npm run sla:watch` em outro terminal, junto de `npm run dev`. A rotina consulta o banco imediatamente e a cada cinco minutos.

Em uma implantação com agendador externo, configure `CRON_SECRET` e faça uma chamada `GET /api/cron/alertas-sla` a cada cinco minutos com `Authorization: Bearer <CRON_SECRET>`. O agendador deve ter acesso ao servidor Next.js; `npm run sla:watch` não é necessário nesse caso.

As janelas são contadas a partir do horário atual, sem depender de fuso para a comparação. O horário apresentado no e-mail usa `America/Sao_Paulo`.

## Teste imediato de um ticket

Na pasta `src`, execute `npm run sla:test -- --enviar <ID_DO_TICKET>`. O comando simula que somente esse ticket entrou na janela de alerta e **envia o email real para `EMAIL_USER`**, com `[TESTE]` no assunto. Isso permite conferir a mensagem mesmo quando o gestor do projeto tem um endereço fictício. Não precisa esperar o relógio nem manter o servidor Next.js aberto, mas o banco e o SMTP devem estar acessíveis. Um alerta enviado no teste fica registrado em `alertas_sla` e não será reenviado automaticamente quando o prazo real se aproximar. Para repetir, crie outro ticket de teste. O envio automático continua usando o endereço cadastrado para o gestor do projeto.
