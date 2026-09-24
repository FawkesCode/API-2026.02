# 📖 Manual de desenvolvimento: Docker Compose e Prisma

Este manual configura o MySQL local do backend e explica como conectar a aplicação e o Prisma ao banco.

## 🛠️ Pré-requisitos

- Docker Desktop em execução;
- Bun ou NodeJs instalado;
- dependências instaladas dentro de `src` com `bun install` ou `npm install`.

Os comandos abaixo devem ser executados a partir de `src`, onde estão o `docker-compose.yml`, o `.env` e o projeto Prisma.

## 1. Configurar o ambiente

Copie o arquivo de exemplo:

```powershell
Copy-Item .env.example .env
```

ou se quiser ser preguiçoso:

Copia direto no editor de código e cola em cima, vai criar um .env.example.copy que você irá renomear para .env

O `.env` não deve ser versionado. Ajuste as variáveis conforme a tabela:

| Variável              | Uso                                                                                                                                                             | Exemplo local                             |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `MYSQL_HOST`          | Host usado pela aplicação para encontrar o MySQL. Como a aplicação roda fora do container, use `localhost`.                                                     | `localhost`                               |
| `MYSQL_PORT`          | Porta do computador publicada para o MySQL. Dentro do container, o MySQL continua escutando na `3306`. Use outra porta se já houver um MySQL local nessa porta. | `3307`                                    |
| `MYSQL_USER`          | Usuário comum usado pela aplicação durante a execução normal.                                                                                                   | `altave`                                  |
| `MYSQL_PASSWORD`      | Senha do usuário comum.                                                                                                                                         | `123456`                                  |
| `MYSQL_DATABASE`      | Banco criado pelo container e usado pela aplicação.                                                                                                             | `test`                                    |
| `MYSQL_ROOT_PASSWORD` | Senha do usuário administrativo `root` do MySQL. Também é usada pelo Prisma nas migrations.                                                                     | `123456`                                  |
| `production`          | Indica se o ambiente é de produção. Atualmente não é usada pelo `docker-compose.yml` nem pelo cliente Prisma; mantenha `false` no desenvolvimento.              | `false`                                   |
| `DATABASE_URL`        | URL usada pelo Prisma CLI, incluindo `migrate`. Ela deve apontar para o mesmo host, porta e banco configurados acima.                                           | `mysql://root:123456@localhost:3307/test` |

### Evitar conflito com um MySQL na porta 3306

Use, por exemplo, a porta `3307` no `.env`:

```dotenv
MYSQL_HOST=localhost
MYSQL_PORT=3307
MYSQL_USER=altave
MYSQL_PASSWORD=123456
MYSQL_DATABASE=test
MYSQL_ROOT_PASSWORD=123456
production=false
DATABASE_URL="mysql://root:123456@localhost:3307/test"
```

O mapeamento do Compose é `${MYSQL_PORT}:3306`: a porta à esquerda é a porta do computador; a porta à direita é a porta fixa dentro do container. A aplicação e o Prisma CLI executados no computador devem usar a porta à esquerda.

Se o usuário ou a senha tiverem caracteres especiais, faça o escape deles na `DATABASE_URL` como parte de uma URL. Para desenvolvimento, prefira credenciais simples e locais para evitar problemas de codificação.

## 2. Subir e parar o banco

Suba o MySQL em segundo plano:

```powershell
docker compose up -d
```

Confira o estado e os logs:

```powershell
docker compose ps
docker compose logs -f mysql
```

Pare os containers:

```powershell
docker compose down
```

O Compose atual não declara volume para os dados. Remover o container com `docker compose down` remove o banco criado nele; em desenvolvimento, recrie o serviço com `docker compose up -d` quando necessário.

## 3. Gerar o cliente Prisma

Depois de instalar dependências ou alterar o schema, gere o cliente:

```powershell
bunx prisma generate
```

ou

```powershell
npx prisma generate
```

O cliente é gerado em `lib/generated/prisma`, conforme definido em `prisma/schema.prisma`.

## 4. Executar migrations

O Prisma CLI lê `DATABASE_URL` pelo arquivo `prisma7.config.ts`. Para criar e aplicar uma migration durante o desenvolvimento:

```powershell
bunx prisma migrate dev --name nome_da_migration
```

ou

```powershell
npx prisma migrate dev --name nome_da_migration
```

Para aplicar somente migrations já existentes:

```powershell
bunx prisma migrate deploy
```

ou

```powershell
npx prisma migrate deploy
```

As migrations devem ser executadas com o usuário `root`. O usuário comum (`MYSQL_USER`) é destinado à aplicação e pode não ter todas as permissões necessárias para criar ou alterar tabelas, índices, chaves estrangeiras e a tabela de controle de migrations. Manter um workaround para conceder permissões administrativas ao usuário comum acrescenta complexidade e não traz benefício para o ambiente local.

Assim, durante migrations, confira que `DATABASE_URL` usa `root` e a senha definida em `MYSQL_ROOT_PASSWORD`:

```dotenv
DATABASE_URL="mysql://root:123456@localhost:3307/test"
```

Depois que as migrations terminarem, a aplicação continua usando `MYSQL_USER` e `MYSQL_PASSWORD`:

```dotenv
MYSQL_USER=altave
MYSQL_PASSWORD=123456
```

Não é necessário trocar o usuário da aplicação para `root`.

## Fluxo recomendado

```powershell
cd src
Copy-Item .env.example .env
# ajuste o .env; use 3307 se a 3306 já estiver ocupada
docker compose up -d
bun install
bunx prisma migrate dev --name nome_da_migration
bunx prisma generate
bun run dev
```

ou

```powershell
cd src
Copy-Item .env.example .env
# ajuste o .env; use 3307 se a 3306 já estiver ocupada
docker compose up -d
npm install
npx prisma migrate dev --name nome_da_migration
npx prisma generate
npm run dev
```

Se a conexão falhar, confirme nesta ordem: o container está em execução (`docker compose ps`), a porta publicada está livre, `MYSQL_PORT` e a porta de `DATABASE_URL` são iguais, e a senha do `root` coincide com `MYSQL_ROOT_PASSWORD`.
