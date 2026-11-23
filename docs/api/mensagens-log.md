# Mensagens padrão para logs de ticket

Os textos salvos são particulares de cada usuário. Eles servem para preencher a descrição de um novo log no chat de um ticket. Salvar ou selecionar um texto **não publica um log** nem altera o status do ticket; a publicação continua em `POST /api/tickets/:id/logs`.

Ambas as rotas exigem sessão ativa com cargo `TECNICO`, `GESTOR` ou `SUPORTE`, como a criação de logs de ticket.

| Método | Rota | Uso |
| --- | --- | --- |
| `POST` | `/api/mensagens-log` | Salva `{ "mensagem": "Começando os trabalhos." }` e retorna o item criado (`201`). |
| `GET` | `/api/mensagens-log` | Lista os itens do usuário autenticado, mais recentes primeiro (`200`). |

Cada item retorna `id`, `mensagem`, `criadoEm` e `atualizadoEm`. O usuário é obtido da sessão; o cliente não envia `usuarioId`. Mensagens vazias, só com espaços ou acima de 10.000 caracteres retornam `400`; sessão ausente retorna `401` e cargo sem permissão retorna `403`.

Antes de usar as rotas em outro banco, aplique a migração Prisma da branch. A tela de cadastro e o seletor de mensagens no chat pertencem às tasks de frontend.
