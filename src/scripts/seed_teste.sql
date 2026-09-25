-- seed_teste.sql
-- Script de seed gerado para popular as tabelas equipes, clientes, usuarios, projetos e tickets
-- utilizando variáveis para manter a integridade das chaves estrangeiras.

SET @equipe_id = COALESCE(
    (SELECT id FROM equipes WHERE nome = 'Equipe Suporte' LIMIT 1),
    '5a41e662-101b-4176-abdb-d755f05213d1'
);
SET @cliente_id = UUID();
SET @gestor_id = UUID();
SET @projeto_id = UUID();

-- 1. Criar Equipe
INSERT INTO equipes (id, nome, ativo, criado_em, atualizado_em) 
VALUES (@equipe_id, 'Equipe Suporte', TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE ativo = TRUE, atualizado_em = NOW();

-- Usuário mock utilizado pela interface; mantém o ID alinhado ao código.
INSERT INTO usuarios (id, nome, email, senha_hash, cargo, ativo, senha_provisoria, criado_em, atualizado_em, equipe_id)
VALUES (
    '3c14cfc8-b3ae-11f1-9aeb-0ea8acf6b539',
    'Admin',
    'admin@gmail.com',
    'senha-fake-para-teste',
    'SUPORTE',
    TRUE,
    TRUE,
    NOW(),
    NOW(),
    @equipe_id
)
ON DUPLICATE KEY UPDATE
    nome = VALUES(nome),
    cargo = VALUES(cargo),
    ativo = TRUE,
    equipe_id = VALUES(equipe_id),
    atualizado_em = NOW();

-- 2. Criar Cliente
INSERT INTO clientes (id, nome, ativo, criado_em, atualizado_em) 
VALUES (@cliente_id, 'Empresa Teste LTDA', TRUE, NOW(), NOW());

-- 3. Criar Gestor (mantendo o email pessoal)
INSERT INTO usuarios (id, nome, email, senha_hash, cargo, ativo, senha_provisoria, criado_em, atualizado_em, equipe_id) 
VALUES (
    @gestor_id, 
    'Gestor Teste', 
    'vbomfimcunha@gmail.com', 
    'senha-fake-para-teste', 
    'GESTOR', 
    TRUE, 
    TRUE, 
    NOW(), 
    NOW(), 
    @equipe_id
);

-- 4. Criar Projeto
INSERT INTO projetos (id, nome, local_instalacao, ativo, criado_em, atualizado_em, cliente_id, equipe_id, gestor_id) 
VALUES (
    @projeto_id, 
    'Projeto Teste', 
    'Sede Empresa Teste', 
    TRUE, 
    NOW(), 
    NOW(), 
    @cliente_id, 
    @equipe_id, 
    @gestor_id
);

-- 5. Criar Tickets
INSERT INTO tickets (id, titulo, descricao, categoria, prioridade, status, sla_em, criado_em, atualizado_em, projeto_id, aberto_por_id) 
VALUES 
(UUID(), 'Ticket de Teste 1', 'Descrição detalhada do problema ou instalação para o ticket de teste 1.', 'MANUTENCAO', 'BAIXA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 1 DAY), NOW(), NOW(), @projeto_id, @gestor_id),
(UUID(), 'Ticket de Teste 2', 'Descrição detalhada do problema ou instalação para o ticket de teste 2.', 'INSTALACAO', 'MEDIA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 2 DAY), NOW(), NOW(), @projeto_id, @gestor_id),
(UUID(), 'Ticket de Teste 3', 'Descrição detalhada do problema ou instalação para o ticket de teste 3.', 'MANUTENCAO', 'ALTA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 3 DAY), NOW(), NOW(), @projeto_id, @gestor_id),
(UUID(), 'Ticket de Teste 4', 'Descrição detalhada do problema ou instalação para o ticket de teste 4.', 'INSTALACAO', 'CRITICA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 4 DAY), NOW(), NOW(), @projeto_id, @gestor_id),
(UUID(), 'Ticket de Teste 5', 'Descrição detalhada do problema ou instalação para o ticket de teste 5.', 'MANUTENCAO', 'BAIXA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 5 DAY), NOW(), NOW(), @projeto_id, @gestor_id),
(UUID(), 'Ticket de Teste 6', 'Descrição detalhada do problema ou instalação para o ticket de teste 6.', 'INSTALACAO', 'MEDIA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 6 DAY), NOW(), NOW(), @projeto_id, @gestor_id),
(UUID(), 'Ticket de Teste 7', 'Descrição detalhada do problema ou instalação para o ticket de teste 7.', 'MANUTENCAO', 'ALTA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 7 DAY), NOW(), NOW(), @projeto_id, @gestor_id),
(UUID(), 'Ticket de Teste 8', 'Descrição detalhada do problema ou instalação para o ticket de teste 8.', 'INSTALACAO', 'CRITICA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 8 DAY), NOW(), NOW(), @projeto_id, @gestor_id),
(UUID(), 'Ticket de Teste 9', 'Descrição detalhada do problema ou instalação para o ticket de teste 9.', 'MANUTENCAO', 'BAIXA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 9 DAY), NOW(), NOW(), @projeto_id, @gestor_id),
(UUID(), 'Ticket de Teste 10', 'Descrição detalhada do problema ou instalação para o ticket de teste 10.', 'INSTALACAO', 'MEDIA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 10 DAY), NOW(), NOW(), @projeto_id, @gestor_id);

-- Alocar a equipe do projeto aos tickets de exemplo.
INSERT INTO ticket_equipes (id, criado_em, ticket_id, equipe_id)
SELECT UUID(), NOW(), id, @equipe_id
FROM tickets
WHERE projeto_id = @projeto_id AND aberto_por_id = @gestor_id;

