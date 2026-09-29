-- seed_teste.sql
-- Script de seed gerado para popular as tabelas equipes, clientes, usuarios, projetos e tickets
-- utilizando variáveis para manter a integridade das chaves estrangeiras.
USE test;
SET @equipe_id = COALESCE(
    (SELECT id FROM equipes WHERE nome = 'Equipe de Instalação Offshore' LIMIT 1),
    '5a41e662-101b-4176-abdb-d755f05213d1'
);
SET @equipe2_id = UUID();
SET @equipe3_id = UUID();

SET @cliente_id = UUID();
SET @cliente2_id = UUID();
SET @cliente3_id = UUID();
SET @cliente4_id = UUID();

SET @gestor_id = UUID();
SET @gestor2_id = UUID();
SET @gestor3_id = UUID();

SET @tecnico1_id = UUID();
SET @tecnico2_id = UUID();

SET @projeto_id = UUID();
SET @projeto2_id = UUID();
SET @projeto3_id = UUID();
SET @projeto4_id = UUID();


-- 1. Criar Equipes
INSERT INTO equipes (id, nome, ativo, criado_em, atualizado_em) 
VALUES (@equipe_id, 'Instalação Offshore', TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE ativo = TRUE, atualizado_em = NOW();

INSERT INTO equipes (id, nome, ativo, criado_em, atualizado_em) 
VALUES (@equipe2_id, 'Visão Computacional & IA', TRUE, NOW(), NOW());

INSERT INTO equipes (id, nome, ativo, criado_em, atualizado_em) 
VALUES (@equipe3_id, 'Monitoramento e Suporte Contínuo', TRUE, NOW(), NOW());

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

-- 2. Criar Clientes
INSERT INTO clientes (id, nome, ativo, criado_em, atualizado_em) 
VALUES 
(@cliente_id, 'PetroOcean Exploração SA', TRUE, NOW(), NOW()),
(@cliente2_id, 'Navegação Marítima do Atlântico LTDA', TRUE, NOW(), NOW()),
(@cliente3_id, 'DrillTech Plataformas ME', TRUE, NOW(), NOW()),
(@cliente4_id, 'Frota Mercante Global SA', TRUE, NOW(), NOW());


-- 3. Criar Gestores e Técnicos
INSERT INTO usuarios (id, nome, email, senha_hash, cargo, ativo, senha_provisoria, criado_em, atualizado_em, equipe_id) 
VALUES 
(@gestor_id, 'Vitor', 'vbomfimcunha@gmail.com', 'senha-fake-para-teste', 'GESTOR', TRUE, TRUE, NOW(), NOW(), @equipe_id),
(@gestor2_id, 'Tais', 'tata.ssouz47@gmail.com', 'senha-fake-para-teste', 'GESTOR', TRUE, TRUE, NOW(), NOW(), @equipe2_id),
(@gestor3_id, 'Gabriel', 'gabixp4@gmail.com', 'senha-fake-para-teste', 'GESTOR', TRUE, TRUE, NOW(), NOW(), @equipe3_id),
(@tecnico1_id, 'Rafael Souza', 'rafael.souza@techmail.com', 'senha-fake-para-teste', 'TECNICO', TRUE, TRUE, NOW(), NOW(), @equipe_id),
(@tecnico2_id, 'Amanda Costa', 'amanda.costa@techmail.com', 'senha-fake-para-teste', 'TECNICO', TRUE, TRUE, NOW(), NOW(), @equipe2_id);


-- 4. Criar Projetos
INSERT INTO projetos (id, nome, local_instalacao, descricao, ativo, criado_em, atualizado_em, cliente_id, equipe_id, gestor_id) 
VALUES 
(@projeto_id, 'Detecção de EPI', 'Plataforma, RJ', 'Monitoramento de segurança via IA para checar uso de EPIs offshore.', TRUE, NOW(), NOW(), @cliente_id, @equipe_id, @gestor_id),
(@projeto2_id, 'Monitoramento', 'Embarcação Atlântico', 'Visão computacional para guiar atracação e evitar colisões no cais.', TRUE, NOW(), NOW(), @cliente2_id, @equipe_id, @gestor_id),
(@projeto3_id, 'Vigilância Térmica', 'Plataforma DrillTech,SP', 'CFTV térmico com IA para prever falhas mecânicas por superaquecimento.', TRUE, NOW(), NOW(), @cliente3_id, @equipe2_id, @gestor2_id),
(@projeto4_id, 'Análise de Movimentação', 'Navio Cargueiro', 'Câmeras em guindastes para contagem e verificação da distribuição de carga.', TRUE, NOW(), NOW(), @cliente4_id, @equipe3_id, @gestor3_id);

-- 5. Criar Tickets
INSERT INTO tickets (id, titulo, descricao, categoria, prioridade, status, sla_em, criado_em, atualizado_em, projeto_id, aberto_por_id) 
VALUES 
-- 10 Tickets do Projeto 1 (PetroOcean - Plataforma P-77)
(UUID(), 'Instalação de Câmera ATEX no Convés', 'Fixar e cabear câmera à prova de explosão (ATEX) no convés principal para monitoramento de capacetes.', 'INSTALACAO', 'ALTA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 1 DAY), NOW(), NOW(), @projeto_id, @gestor_id),
(UUID(), 'Calibração do modelo de IA (EPIs)', 'Ajustar o threshold do modelo de visão computacional; muitos alarmes falsos de "ausência de óculos" em dias de chuva.', 'MANUTENCAO', 'MEDIA', 'EM_ANDAMENTO', DATE_ADD(NOW(), INTERVAL 2 DAY), NOW(), NOW(), @projeto_id, @gestor_id),
(UUID(), 'Limpeza de domo com acúmulo de sal', 'Câmera do setor de perfuração está com a imagem embaçada devido à forte maresia. Necessária limpeza técnica.', 'MANUTENCAO', 'BAIXA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 3 DAY), NOW(), NOW(), @projeto_id, @gestor_id),
(UUID(), 'Instalação do servidor de Edge Computing', 'Rack principal da plataforma precisa receber o novo servidor edge com GPUs para processamento local de vídeo.', 'INSTALACAO', 'CRITICA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 4 DAY), NOW(), NOW(), @projeto_id, @gestor_id),
(UUID(), 'Troca de patch cord blindado', 'Substituir cabo de rede blindado CAT7 que liga a câmera 04 ao switch PoE offshore, danificado por impacto mecânico.', 'MANUTENCAO', 'MEDIA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 5 DAY), NOW(), NOW(), @projeto_id, @gestor_id),
(UUID(), 'Treinamento extra da IA para luvas graxadas', 'Atualizar o dataset de inferência: a IA não está reconhecendo luvas quando estão excessivamente sujas de óleo.', 'MANUTENCAO', 'ALTA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 6 DAY), NOW(), NOW(), @projeto_id, @gestor_id),
(UUID(), 'Configuração de alarme na sala de controle', 'Integrar o alerta de violação de EPI emitido pela IA com as sirenes e luzes da sala de controle da P-77.', 'INSTALACAO', 'MEDIA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 7 DAY), NOW(), NOW(), @projeto_id, @gestor_id),
(UUID(), 'Substituição do housing da câmera 2', 'Carcaça de inox da câmera de estibordo apresentou sinais de oxidação não prevista. Realizar a troca em garantia.', 'MANUTENCAO', 'BAIXA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 8 DAY), NOW(), NOW(), @projeto_id, @gestor_id),
(UUID(), 'Adição de lente varifocal na grua', 'Instalar lente específica para longas distâncias na câmera focada no operador do guindaste offshore.', 'INSTALACAO', 'MEDIA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 9 DAY), NOW(), NOW(), @projeto_id, @gestor_id),
(UUID(), 'Queda de conexão do Edge para a Nuvem', 'O servidor local está processando a IA normalmente, mas a ponte via satélite (VSAT) está derrubando os logs.', 'MANUTENCAO', 'CRITICA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 1 DAY), NOW(), NOW(), @projeto_id, @gestor_id),

-- 5 Tickets do Projeto 2 (Navegação Marítima - Embarcação)
(UUID(), 'Montagem de câmera PTZ no Mastro', 'Instalação de câmera Pan-Tilt-Zoom com infravermelho no mastro principal para análise de aproximação ao cais.', 'INSTALACAO', 'ALTA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 2 DAY), NOW(), NOW(), @projeto2_id, @gestor_id),
(UUID(), 'Rastreamento visual de cabos de atracação', 'Configurar o algoritmo de rastreamento (bounding boxes) para monitorar a tensão dos cabos durante a atracação.', 'MANUTENCAO', 'MEDIA', 'EM_ANDAMENTO', DATE_ADD(NOW(), INTERVAL 3 DAY), NOW(), NOW(), @projeto2_id, @gestor_id),
(UUID(), 'Atualização de firmware (Night Vision)', 'Aplicar novo firmware fornecido pelo fabricante para reduzir ruído de imagem (noise reduction) em navegação noturna.', 'MANUTENCAO', 'BAIXA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 5 DAY), NOW(), NOW(), @projeto2_id, @gestor_id),
(UUID(), 'Instalação de NVR em rack naval', 'Fixação do Network Video Recorder no rack com sistema anti-vibração próprio para embarcações em alto mar.', 'INSTALACAO', 'ALTA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 6 DAY), NOW(), NOW(), @projeto2_id, @gestor_id),
(UUID(), 'Falha no tracking dinâmico com chuva', 'O módulo de Visão Computacional está perdendo a detecção do rebocador sob chuva forte. Necessário re-treino.', 'MANUTENCAO', 'CRITICA', 'EM_ANDAMENTO', DATE_ADD(NOW(), INTERVAL 1 DAY), NOW(), NOW(), @projeto2_id, @gestor_id),

-- 5 Tickets do Projeto 3 (DrillTech - Plataforma)
(UUID(), 'Instalação de Câmera Térmica FLIR', 'Montagem de sensor térmico na sala de compressores para identificar superaquecimento autônomo sem intervenção humana.', 'INSTALACAO', 'CRITICA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 4 DAY), NOW(), NOW(), @projeto3_id, @gestor2_id),
(UUID(), 'Ajuste de ROI (Region of Interest)', 'Desenhar os limites virtuais de análise térmica exatamente no gerador principal, ignorando reflexos das tubulações quentes.', 'MANUTENCAO', 'MEDIA', 'EM_ANDAMENTO', DATE_ADD(NOW(), INTERVAL 2 DAY), NOW(), NOW(), @projeto3_id, @gestor2_id),
(UUID(), 'Interrupção de link 5G privado', 'A transmissão de vídeo da câmera térmica para o dashboard offshore via 5G privado está com perdas severas de pacotes.', 'MANUTENCAO', 'ALTA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 1 DAY), NOW(), NOW(), @projeto3_id, @gestor2_id),
(UUID(), 'Calibração radiométrica', 'Refinar a conversão de pixels infravermelhos para a temperatura exata (Celsius) da leitura da IA.', 'MANUTENCAO', 'MEDIA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 2 DAY), NOW(), NOW(), @projeto3_id, @gestor2_id),
(UUID(), 'Cabeamento de redundância em anel', 'Implementar anel de fibra óptica blindado ligando todas as 6 câmeras de segurança térmica da plataforma.', 'INSTALACAO', 'ALTA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 7 DAY), NOW(), NOW(), @projeto3_id, @gestor2_id),

-- 5 Tickets do Projeto 4 (Frota Mercante - Navio Cargueiro, gerido pelo Gestor 3)
(UUID(), 'Calibração de contagem de contêineres', 'O modelo YOLOv8 está falhando ao detectar contêineres sobrepostos no convés traseiro. Necessário recalibrar a detecção.', 'MANUTENCAO', 'ALTA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 3 DAY), NOW(), NOW(), @projeto4_id, @gestor3_id),
(UUID(), 'Troca de cabos umidificados no guindaste', 'Cabos da câmera de topo do guindaste apresentaram infiltração e estão gerando artefatos na imagem capturada.', 'MANUTENCAO', 'MEDIA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 4 DAY), NOW(), NOW(), @projeto4_id, @gestor3_id),
(UUID(), 'Instalação de Câmera Estereoscópica', 'Posicionamento de duas novas câmeras estereoscópicas para capturar profundidade volumétrica dos blocos de carga.', 'INSTALACAO', 'ALTA', 'EM_ANDAMENTO', DATE_ADD(NOW(), INTERVAL 2 DAY), NOW(), NOW(), @projeto4_id, @gestor3_id),
(UUID(), 'Atualização de módulo de inferência (Jetson)', 'Fazer a troca do módulo Nvidia Jetson Nano por um Jetson Orin para suportar a nova taxa de quadros (60fps) das câmeras.', 'INSTALACAO', 'CRITICA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 1 DAY), NOW(), NOW(), @projeto4_id, @gestor3_id),
(UUID(), 'Treino de IA contra pássaros', 'Falso-positivos acionados constantemente por gaivotas cruzando a linha de visão do sensor. Atualizar a base de exclusão.', 'MANUTENCAO', 'BAIXA', 'NAO_INICIADO', DATE_ADD(NOW(), INTERVAL 5 DAY), NOW(), NOW(), @projeto4_id, @gestor3_id);


-- Alocar a equipe do projeto aos tickets de exemplo.
INSERT INTO ticket_equipes (id, criado_em, ticket_id, equipe_id)
SELECT UUID(), NOW(), id, @equipe_id
FROM tickets
WHERE projeto_id IN (@projeto_id, @projeto2_id);

INSERT INTO ticket_equipes (id, criado_em, ticket_id, equipe_id)
SELECT UUID(), NOW(), id, @equipe2_id
FROM tickets
WHERE projeto_id = @projeto3_id;

INSERT INTO ticket_equipes (id, criado_em, ticket_id, equipe_id)
SELECT UUID(), NOW(), id, @equipe3_id
FROM tickets
WHERE projeto_id = @projeto4_id;


-- 6. Inserir Histórico (Logs) em metade dos tickets
INSERT INTO historico_ticket (id, evento, descricao, criado_em, ticket_id, usuario_id)
SELECT UUID(), 'ATIVIDADE_INICIADA', 'O responsável iniciou o atendimento a este chamado.', DATE_ADD(NOW(), INTERVAL -1 DAY), id, aberto_por_id
FROM tickets
LIMIT 12;

INSERT INTO historico_ticket (id, evento, descricao, criado_em, ticket_id, usuario_id)
SELECT UUID(), 'Atualização de Diagnóstico', 'Realizada a vistoria preliminar. Os componentes físicos estão sendo testados e a configuração de software validada.', DATE_ADD(NOW(), INTERVAL -2 HOUR), id, aberto_por_id
FROM tickets
LIMIT 12;

