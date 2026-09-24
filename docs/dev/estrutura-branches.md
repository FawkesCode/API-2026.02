# 🌿Estratégia de Branch

## 📝 **Justificativa**

Em discussões sobre o processo de code review em pull requests, o grupo questionou o tempo que outro dev levaria para revisar o código e definir o status do merge (aprovado/negado). Como o revisor precisaria entender as mudanças e, em alguns casos, navegar pelo projeto na branch com a solicitação, perecebemos que a entrega da feature ficaria adiada até sua disponibilidade para verificar se atende aos critérios da subtask. 

Para evitar que esse fator aumente o tempo de entrega da equipe, implementamos revisão automática de código nos pull requests com um fluxo do n8n. Assim reduzimos a espera e tornamos o desenvolvedor autor da branch independente para corrigir e atender aos critérios da subtask por conta própria.

> [!NOTE]
> **OBS: Mudanças na nomenclatura**
>
> As branches criadas até o início da terceira semana da sprint 1 seguiam o padrão: `<tipo>/<descrição>`.
> O grupo, porém, decidiu alterar a nomenclatura para melhorar o fluxo n8n e obter revisões mais completas com base nos critérios de aceite de uma subtask no Jira.
> Por isso, o novo padrão inclui `SCRUM-#` antes da descrição da atividade, permitindo que o agente do fluxo n8n identifique qual subtask conferir ao gerar a revisão.

---

## 🚩 **Padrão de Nomenclatura**

> Os nomes devem estar em inglês e em kebab-case

```
- main: Branch principal e estável.
- development: Branch intermediária para inserção de novas funcionalidades antes de entrarem na main.

- feat: Para novas funcionalidades.
- refactor: Para alterações em códigos previamente criados
- fix: Para realizar correções em códigos quebrados
```

> Após o declarar o tipo da branch, deve-se informar o id do Jira a que ela faz referência e, uma breve descrição do que ela incrementa:
> Exemplo: feat/SCRUM-34-projects-front-endpoints
>
> Se a nova funcionalidade abranger mais de uma task (da mesma US), coloque o id da user story ao invés da subtask

## Processo de Code Review

- Todo PR precisa estar aprovado pelo agente do fluxo antes de poder ser mesclado.
- O autor da branch é responsável por responder aos comentários e realizar os ajustes necessários.
- O autor da branch deve adicionar comentários ao pull request para quando houver sugestões não seguidas na revisão e o porque dessa escolha.

## Processo de Pull Request (Automação via n8n)

Para agilizar o ciclo de desenvolvimento, a criação dos Pull Requests é automatizada via **n8n**:

### Como funciona a Automação:

1. **Gatilho**: Ao realizar um push para qualquer branch de trabalho, o fluxo do n8n é acionado;
2. **Criação do PR:** O n8n cria automaticamente um Pull Request com:

- A branch de trabalho enviada, apontando sempre para a `development`;
- O autor da branch e um resumo automatizado sobre as mudanças que foram feitas, com uma análise se a branch está cumprindo com os critérios de aceite especificados na subtask do Jira;

### Responsabilidades do Desenvolvedor:

- **Conferir a documentação gerada pelo agente:** Como o PR é aberto e preenchido automaticamente pelo n8n, o autor da branch precisa constantemente revisitar o pull request criado e verificar se o merge está seguro e, a partir disso, concluir o processo para então fechar o PR.

> Os merges da branch development para a main devem ser solicitados em PRs manuais, estes serão avaliados atenciosamente pelos outros membros do grupo.

### Checklist obrigatória antes de fechar um PR:

- [ ] Descrição do PR preenchida e revisitada pelo autor da branch
- [ ] Código foi revisado e corrigido a partir de todas as exigências do agente do n8n
- [ ] Testes foram executados com sucesso
- [ ] Conflitos com a branch `development` resolvidos
- [ ] Responsável pela revisão atualizou a tarefa no Jira de `Em Análise` para `Concluída` ao aprovar o merge
