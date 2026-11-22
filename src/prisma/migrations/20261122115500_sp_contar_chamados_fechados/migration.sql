DROP PROCEDURE IF EXISTS sp_contar_chamados_fechados;

CREATE PROCEDURE sp_contar_chamados_fechados(
  IN p_equipe_id CHAR(36),
  IN p_usuario_id CHAR(36),
  IN p_projeto_id CHAR(36),
  IN p_cliente_id CHAR(36),
  IN p_data_inicio DATETIME(3),
  IN p_data_fim DATETIME(3),
  OUT p_total INT
)
SELECT COUNT(*)
INTO p_total
FROM tickets t
INNER JOIN projetos p ON p.id = t.projeto_id
WHERE t.status = 'ENCERRADO'
  AND (p_projeto_id IS NULL OR t.projeto_id = p_projeto_id)
  AND (p_cliente_id IS NULL OR p.cliente_id = p_cliente_id)
  AND (p_data_inicio IS NULL OR t.encerrado_em >= p_data_inicio)
  AND (p_data_fim IS NULL OR t.encerrado_em <= p_data_fim)
  AND (
    p_equipe_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM ticket_equipes te
      WHERE te.ticket_id = t.id
        AND te.equipe_id = p_equipe_id
    )
  )
  AND (
    p_usuario_id IS NULL
    OR t.aberto_por_id = p_usuario_id
    OR t.responsavel_id = p_usuario_id
    OR EXISTS (
      SELECT 1
      FROM historico_ticket h
      WHERE h.ticket_id = t.id
        AND h.usuario_id = p_usuario_id
    )
  );
