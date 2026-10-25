# Autenticação e autorização

## `POST /api/auth/login`

Autentica um usuário ativo com e-mail e senha.

### Requisição

```json
{
  "email": "usuario@example.com",
  "senha": "Senha@123"
}
```

### Sucesso (`200`)

A resposta inclui a identidade pública do usuário e indica se a senha é provisória:

```json
{
  "usuario": {
    "id": "uuid",
    "nome": "Nome do usuário",
    "email": "usuario@example.com",
    "cargo": "TECNICO"
  },
  "senhaProvisoria": true
}
```

O servidor também define o cookie `session`, `HttpOnly`, `SameSite=Lax` e com validade de oito horas. O atributo `Secure` é habilitado em produção. O token é assinado com `SESSION_SECRET`; configure um segredo próprio no ambiente de execução.

### Erros

- `400` para JSON ou dados malformados.
- `401` com `CREDENCIAIS_INVALIDAS` e a mesma mensagem para usuário inexistente, senha incorreta ou usuário inativo.
- `500` para falha inesperada no servidor.

## Restrições por cargo

Rotas restritas usam a função compartilhada `exigirCargo`. Ela responde `401` para sessão ausente/inválida ou usuário inativo e `403` quando o cargo não tem permissão. Os serviços ainda aplicam regras de domínio, como exigir que o gestor pertença à equipe alterada.

| Rota | Cargo permitido | Regra adicional |
| --- | --- | --- |
| `POST /api/usuarios` | `SUPORTE_INTERNO` | Conforme a história de cadastro e gestão de usuários do suporte interno. |
| `GET /api/usuarios/detalhado` | `SUPORTE_INTERNO` | — |
| `PATCH /api/equipes/:id` | `GESTOR` | Gestor deve pertencer à equipe. |
| `PATCH /api/equipes/:id/tecnicos` | `GESTOR` | Gestor deve pertencer à equipe; IDs devem ser de técnicos válidos. |
| `PUT /api/tickets/:id` | `GESTOR` | Gestor deve pertencer à equipe do projeto do ticket. |
| `POST /api/tickets/:id/logs` | `TECNICO`, `SUPORTE`, `GESTOR` | Usuário deve pertencer a uma equipe alocada; decisões de encerramento são exclusivas do gestor. |
