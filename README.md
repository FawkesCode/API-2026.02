# API 2º Semestre DSM

# Sistema de Ordens de Serviço

<p align="center">
  <img src="docs/img/fawkes-logo.png" alt="Logo Fawkes" width="180"/>
  <h2 align="center">FawkesCode</h2>
</p>

<p align="center">
  | <a href="#desafio">Desafio</a> |
  <a href="#solucao">Solução</a> |
  <a href="#backlog">Backlog do Produto</a> |
  <a href="#dor">DoR</a> |
  <a href="#dod">DoD</a> |
  <a href="#sprints">Sprints</a> |
  <a href="#tecnologias">Tecnologias</a> |
  <a href="#executar">Como executar</a> |
  <a href="#equipe">Equipe</a> |
</p>

> **Parceiro:** Altave &nbsp;·&nbsp; **Curso:** 2º DSM &nbsp;·&nbsp; **Período:** 2026-2
>
> **Status do Projeto:** Em Andamento 🚧

---

## 🏭 Desafio <a id="desafio"></a>

A Altave enfrenta uma gestão operacional fragmentada e descentralizada: equipes utilizam softwares isolados de escolha própria, os fluxos de trabalho não se integram e o acompanhamento de demandas torna-se dependente dos processos burocráticos de cada equipe.

O resultado são ruídos de comunicação entre times, falta de visibilidade em tempo real para a liderança e perda de rastreabilidade das solicitações.

Nesse contexto, o desafio é construir uma plataforma unificada de tickets com interface intuitiva, centralizando os processos - desde o envio de demandas até o rastreamento completo de cada serviço.

---

## 💡 Solução <a id="solucao"></a>

A api desenvolvida é uma aplicação web criada com Next.js, voltada à gestão completa dos tickets de serviço da Altave.

A solução contempla abertura de tickets atrelados a algum projeto, fluxo de aprovação de encerramento com parecer registrado, controle do acesso de funcionários com o cadastro e inativação de contas, mensageria para avisos importantes para os técnicos e gestores das equipes e rastreabilidade facilmente visível para cada ordem de serviço.

O objetivo é padronizar o processo, eliminar a necessidade de vários softwares para uma mesma função e gerar um histórico confiável sobre o andamento das demandas.

---

## **📖 Product Backlog** <a id="backlog"></a>

| Rank | Prioridade | User Story                                                                                                                                                                                                       | Estimativa | Sprint |
| :--: | :--------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------: | :----: |
|  1   |    Alta    | Como ANALISTA COMERCIAL, quero cadastrar um novo projeto, e gerar um ticket vinculado a ele, para que o projeto seja registrado na plataforma e sua instalação possa ser acompanhada pela equipe(s) responsável. |     13     |   1    |
|  2   |    Alta    | Como TÉCNICO, quero visualizar os tickets atribuídos ao meu time, para que eu possa me manter informado quanto às demandas pendentes.                                                                            |     13     |   1    |
|  3   |   Baixa    | Como GESTOR, quero receber um email quando um ticket for associado ao meu time, para que eu possa me manter informado das demandas.                                                                              |     5      |   1    |
|  4   |    Alta    | Como TÉCNICO, quero poder adicionar logs/mensagens ao chamado, com campo para especificar o reparo feito, materiais utilizados, e outros detalhes, para que eu possa registrar o trabalho feito.                 |     13     |   1    |
|  5   |    Alta    | Como TÉCNICO, quero que haja algum indicador visual do SLA nos tickets, para que eu possa avaliar a urgência de cada demanda.                                                                                    |     13     |   1    |
|  6   |   Baixa    | Como GESTOR, quero poder alterar a prioridade dos tickets, para que a urgência de cada cliente seja respeitada.                                                                                                  |     8      |   1    |
|  7   |   Baixa    | Como GESTOR, quero que os tickets de maior prioridade apareçam no topo da fila, para que minha priorização de demandas seja mais rápida e precisa.                                                               |     8      |   1    |
|  8   |   Baixa    | Como ANALISTA DE SUPORTE EXTERNO, quero poder criar tickets de manutenção e atribuir estes tickets a um determinado projeto, para que o time responsável possa atuar.                                            |     8      |   1    |
|  9   |   Media    | Como ANALISTA DE SUPORTE INTERNO, quero criar contas para os técnicos na plataforma, para que os usuários criados estejam padronizados.                                                                          |     13     |   2    |
|  10  |   Baixa    | Como GESTOR, quero poder editar o nome e a descrição da equipe, para que essas informações fiquem mais direcionadas a área de atuação que faço parte.                                                            |     5      |   2    |
|  11  |   Media    | Como GESTOR, quero adicionar os técnicos previamente criados na minha equipe, para que eles tenham acesso aos tickets.                                                                                           |     5      |   2    |
|  12  |   Baixa    | Como FUNCIONÁRIO, desejo logar na plataforma, para que eu possa acessar o site e que as informações nele estejam protegidas.                                                                                     |     8      |   2    |
|  13  |   Media    | Como GESTOR, quero ter uma equipe própria para me organizar a respeito das demandas em aberto e dos técnicos disponíveis para pegá-las.                                                                          |     8      |   2    |
|  14  |   Media    | Como ANALISTA DE SUPORTE INTERNO, quero ter a funcionalidade de criar contas de gestor, para que os gestores possam ter seus perfis criados e atuarem na empresa.                                                |     8      |   2    |
|  15  |   Media    | Como ANALISTA DE SUPORTE INTERNO, quero que a funcionalidade de criar contas de analista comercial, para que os gestores possam ter seus perfis criados e atuarem na empresa.                                    |     8      |   2    |
|  16  |   Media    | Como ANALISTA DE SUPORTE INTERNO, quero ter a funcionalidade de criar contas de analista de  suporte externo, para que os analistas de suporte externo possam ter seus perfis criados e atuarem na empresa.      |     8      |   2    |
|  17  |   Media    | Como ANALISTA DE SUPORTE INTERNO, quero ter uma tela para poder visualizar todas as contas, para que eu possa visualizar os perfis da empresa.                                                                   |     5      |   2    |
|  18  |   Media    | Como TÉCNICO, quero receber um email quando um ticket for associado ao meu time, para que eu possa me manter informado das demandas.                                                                             |     8      |   3    |
|  19  |   Baixa    | Como GESTOR, quero receber um email com um alerta quando o SLA de um ticket estiver próximo do fim, para que eu possa gerir de maneira mais coordenada o meu time.                                               |     5      |   3    |
|  20  |   Baixa    | Como ANALISTA DE SUPORTE INTERNO, quero ter a opção de redefinir as senhas dos técnicos, para que, caso haja algum esquecimento ou vazamento, a plataforma possa ser acessada e protegida.                       |     5      |   3    |
|  21  |   Baixa    | Como ANALISTA DE SUPORTE INTERNO, quero que a senha que eu criei para o técnico seja provisória, para que as senhas dos usuários estejam protegidas                                                              |     8      |   3    |
|  22  |   Media    | Como TÉCNICO, quero que, ao adicionar algum time num ticket, eles recebam um email para que, quando eu necessitar de suporte de outro time, eles sejam notificados e possam me auxiliar.                         |     8      |   3    |
|  23  |   Media    | Como ANALISTA DE SUPORTE INTERNO, quero poder desativar/ativar todos os perfis da empresa, para que eu possa gerenciar os perfis da plataforma.                                                                  |     5      |   3    |
|  24  |   Media    | Como ANALISTA DE SUPORTE INTERNO, quero poder editar todos os perfis da empresa, para que eu possa manter a gerência dos perfis da plataforma.                                                                   |     5      |   3    |

---

## 🏃 **Definition of Ready (DoR)** <a id="dor"></a>:

- Modelo já definido da arquitetura do banco;
- Mockup relacionado já planejado;
- Critérios de aceite definidos e aprovados pela equipe;
- User story bem escritas, respeitando as definições padrões de "Como <usuário> quero <funcionalidade> para <finalidade>" e com os story points estipulados pela equipe;
- Ferramentas e ambientes configurados (Repositório no git, Jira)
- User Stories não ambíguas e com atomicidade;
- Responsibilidades da equipe bem definidas;
- Respeitar os padrões de commits definidos;

## 🏆 **Definition of Done (DoD)** <a id="dod"></a>:

- Código alinhado com o exigido nos critérios de aceite;
- Testes verficados e validados -> (Relatório dos resultados);
- Código revisado sob aprovação do PO;
- Documentação entregue (Manual de usuário e Manual de instalação);
- Stakeholders cientes da conclusão do projeto.

---

## 📅 Sprints <a id="sprints"></a>

| Sprint          |    Período    |                    Documentação                     | Incremento |
| --------------- | :-----------: | :-------------------------------------------------: | :--------: |
| 🏃🏻 **Sprint 1** | 07/09 – 27/09 | [Sprint 1 docs](./docs/sprints/sprint-backlog-1.md) |            |
| 🏃🏻 **Sprint 2** | 05/10 – 25/10 | [Sprint 2 docs](./docs/sprints/sprint-backlog-2.md) |            |
| 🏃🏻 **Sprint 3** | 02/11 – 22/11 | [Sprint 3 docs](./docs/sprints/sprint-backlog-3.md) |            |

<br>

> [!NOTE]
> **Outros documentos:**
>
> - [Estratégia de Branches](./docs/dev/estrutura-branches.md): explicação sobre o padrão escolhido e sua justificativa.
> - [Manual de Instalação (backend)](./docs/dev/docker-compose.md): cotninuação do tópico "como executar", explicando os requisitos do desenvolvimento back.

---

## 💻 Tecnologias <a id="tecnologias"></a>

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white"/></a>
  <a href="https://react.dev/"><img alt="Static Badge" src="https://img.shields.io/badge/react-00AEDE?style=for-the-badge&logo=react&logoColor=white&logoSize=auto"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white"/></a>
  <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white"/></a>
  <a href="https://www.prisma.io/"><img alt="Static Badge" src="https://img.shields.io/badge/prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white&logoSize=auto"></a>
  <a href="https://ui.shadcn.com/"><img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white"/></a>
  <a href="https://www.mysql.com/"><img alt="Static Badge" src="https://img.shields.io/badge/shadcn_ui-000000?style=for-the-badge&logo=shadcnui&logoColor=white&logoSize=auto"></a>
  <a href="https://tailwindcss.com/"><img alt="Static Badge" src="https://img.shields.io/badge/tailwind_css-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white&logoSize=auto"></a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/CSS"><img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white"/></a>
</p>

## 🚀 Como executar <a id="executar"></a>

### 🛠️ Pré-requisitos

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/pt-br)
- [Docker](https://www.docker.com/)
- [MySQL 8+](https://dev.mysql.com/downloads/)

---

### 1. Clonar o Repositório Principal

```bash
git clone https://github.com/FawkesCode/API-2026.02.git
cd API-2026.02.git
```

Para baixar as dependências:

```bash
cd src
npm install
```

---

### 2. Configuração do backend

Consulte o [Manual de Instalação](./docs/manual-instalacao.md) para prosseguir com essa etapa.

### 3. Configuração do frontend

Entre na pasta src e execute:

```bash
npm run dev
```

**Saída Esperada:**
<br>

> my-app@0.1.0 dev
> next dev
>
> ▲ Next.js 16.3.4 (Turbopack)
>
> - Local: http://localhost:3000
> - Network: http://26.135.59.40:3000
> - Environments: .env
>   ✓ Ready in 1052ms
>   ✓ Running next.config.ts took 258ms

---

## ⚙️ Estrutura do Projeto <a id="estrutura"></a>

```
├── docs
│   ├── img
│   └── sprints
├── src
│   ├── app
│   │   ├── api
│   │   │   ├── clientes
│   │   │   ├── email
│   │   │   ├── projetos
│   │   │   │   ├── [id]
│   │   │   │   │   ├── equipes
│   │   │   │   │   ├── ticket-instalacao
│   │   │   │   │   ├── tickets
│   │   │   ├── tickets
│   │   │   │   ├── [id]
│   │   │   ├── usuarios
│   │   ├── equipe
│   │   │   ├── [id]
│   │   ├── projetos
│   │   │   ├── [id]
│   │   │   │   ├── [ticketId]
│   │   ├── tickets
│   ├── components
│   │   ├── form
│   │   ├── projects
│   │   ├── tickets
│   │   ├── ui
│   ├── hooks
│   ├── lib
│   │   ├── controllers
│   │   ├── data
│   │   ├── generated
│   │   │   └── prisma
│   │   │       ├── internal
│   │   │       ├── models
│   │   ├── mappers
│   │   ├── services
│   │   │   ├── default-classes
│   ├── prisma
│   │   ├── migrations
│   ├── public
│   ├── schemas
│   ├── scripts
│   ├── types
│   └── utils
│
```

## 👥 Equipe <a id="equipe"></a>

<div align="center">
  <table>
    <tr>
      <th>Membro</th>
      <th>Função</th>
      <th>GitHub</th>
      <th>LinkedIn</th>
    </tr>
     <tr>
      <td>Vitor Bomfim</td>
      <td>Product Owner</td>
      <td><a href="https://github.com/VitorBomfim-12"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white"/></a></td>
      <td><a href="https://www.linkedin.com/in/vitor-bomfim-122339289"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white"/></a></td>
    </tr>
     <tr>
      <td>Tais Fernandes</td>
      <td>Scrum Master</td>
      <td><a href="https://github.com/tat4Souza"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white"/></a></td>
      <td><a href="https://www.linkedin.com/in/tais-f-souza"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white"/></a></td>
    </tr>
    <tr>
      <td>Gabriel Campos</td>
      <td>Desenvolvedor</td>
      <td><a href="https://github.com/gabrielyse"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white"/></a></td>
      <td><a href="https://www.linkedin.com/in/gabriel-camposcom"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white"/></a></td>
    </tr>
    <tr>
      <td>Guilherme Machado</td>
      <td>Desenvolvedor</td>
      <td><a href="https://github.com/MachadoGuilherme1206"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white"/></a></td>
      <td><a href="https://www.linkedin.com/in/guilherme-machado-silva-ba2332323"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white"/></a></td>
    </tr>
    <tr>
      <td>Marcos Alexandre</td>
      <td>Desenvolvedor</td>
      <td><a href="https://github.com/MarcosAlexandre-txt"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white"/></a></td>
      <td><a href="https://www.linkedin.com/in/marcos-alexandre-cs/"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white"/></a></td>
    </tr>
    <tr>
      <td>Nathan Ariel</td>
      <td>Desenvolvedor</td>
      <td><a href="https://github.com/Nathan-ADL"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white"/></a></td>
      <td><a href="https://www.linkedin.com/in/nathan-ariel-damasio-leão-7a64522b5?utm_source=share_via&utm_content=profile&utm_medium=member_android"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white"/></a></td>
    </tr>
    <tr>
      <td>Thiago Nascimento</td>
      <td>Desenvolvedor</td>
      <td><a href="https://github.com/Pottassiuw"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white"/></a></td>
      <td><a href="https://www.linkedin.com/in/thiago-nascimento-729077292"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white"/></a></td>
    </tr>
   
   
  </table>
</div>

<br>

---

<sub>Fawkes · 2º DSM · Fatec SJC · 2026-2</sub>

---
