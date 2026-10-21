# Testar a autenticação localmente

Com o MySQL do Docker em execução, rode o seed de desenvolvimento dentro de `src`:

```powershell
cd C:\Codex\HTML,CSS,JS,TS\ApiDSM2\src
npx prisma db seed --config prisma7.config.ts
npm run dev
```

O seed cria/atualiza contas de demonstração somente fora de produção. Credenciais:

| Cargo | E-mail | Senha | Observação |
| --- | --- | --- | --- |
| Técnico | `teste@gmail.com` | `teste123` | Senha provisória; o site solicitará a troca |
| Gestor | `gestor.seed@example.com` | `Gestor@123` | Pertence à Equipe Massa |
| Suporte | `suporte.seed@example.com` | `Suporte@123` | Para testar cadastro/listagem de usuários |
| Comercial | `comercial.seed@example.com` | `Comercial@123` | Para conferir respostas `403` nas ações restritas |
| Técnico | `fernando@massanori.japa` | `Tecnico@123` | Pertence à Equipe Massa |

Após trocar a senha provisória, a sessão deve continuar ativa. O menu lateral deve mostrar o nome, cargo, e-mail e equipe do usuário. Use **SAIR** para encerrar a sessão e entrar com outro cargo.

Essas credenciais são apenas para o banco local de desenvolvimento; o seed não as cria em produção.
