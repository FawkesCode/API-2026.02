# Estratégia de Branch

> Os nomes devem estar em inglês e em kebab-case

```
- main: Branch principal e estável.
- development: Branch intermediária para inserção de novas funcionalidades antes de entrarem na main.

- feat/<nome-da-feature>: Para novas funcionalidades.
- refactor/<especificação-do-conteúdo-refatorado>: Para alterações em códigos previamente criados
- fix/<erro-a-ser-corrigido>: Para realizar correções em códigos quebrados
```

## Processo de Code Review

- Todo PR precisa de pelo menos **1 aprovação** de um outro desenvolvedor antes de poder ser mesclado.
- A revisão deve focar em encontrar possíveis erros nos testes realizados e, manter o padrão de código estabelecido na aplicação.
- O revisor deve adicionar comentários ao pull request para quando houver instabilidades na branch analisada.
- O autor da branch é responsável por responder aos comentários e realizar os ajustes necessários antes de pedir por uma nova avaliação.

## Processo de Pull Request (Automação via n8n)

Para agilizar o ciclo de desenvolvimento, a criação dos Pull Requests é automatizada via **n8n**:

### Como funciona a Automação:

1. **Gatilho**: Ao realizar um push para qualquer branch de trabalho, o fluxo do n8n é acionado;
2. **Criação do PR:** O n8n cria automaticamente um Pull Request com:

- A branch de trabalho enviada, apontando sempre para a `development`;
- O autor da branch e um resumo automatizado sobre as mudanças que foram feitas, com uma seção para sugestões e, no fim da documentação, o veredito de se o PR foi aprovado para merge ou não;

### Responsabilidades do Desenvolvedor:

- **Conferir a documentação gerada pelo agente:** Como o PR é aberto e preenchido automaticamente pelo n8n, um outro dev ainda precisa revisitar o pull request criado e verificar se o merge realmente está seguro e, a partir disso, concluir o merge para então fechar o PR.

> Os merges da branch development para a main devem ser solicitados em PRs manuais, estes serão avaliados atenciosamente pelos outros membros do grupo.

### Checklist obrigatória antes de fechar um PR:

- [ ] Descrição do PR preenchida e contextualizada pelo autor
- [ ] Código foi revisado por pelo menos um desenvolvedor e não quebra a aplicação
- [ ] Testes foram executados com sucesso
- [ ] Conflitos com a branch `development` resolvidos
- [ ] Responsável pela revisão atualizou a tarefa no Jira de `Em Análise` para `Concluída` ao aprovar o merge
