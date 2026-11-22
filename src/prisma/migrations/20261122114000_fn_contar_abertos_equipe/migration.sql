DROP FUNCTION IF EXISTS fn_contar_abertos_equipe;

CREATE FUNCTION fn_contar_abertos_equipe(
  p_equipe_id CHAR(36),
  p_usuario_id CHAR(36),
  p_projeto_id CHAR(36),
  p_cliente_id CHAR(36),
  p_data_inicio DATETIME(3),
  p_data_fim DATETIME(3)
)
RETURNS INT
READS SQL DATA
RETURN (
  SELECT COUNT(*)
  FROM ticket_equipes te
  INNER JOIN tickets t ON t.id = te.ticket_id
  INNER JOIN projetos p ON p.id = t.projeto_id
  WHERE te.equipe_id = p_equipe_id
    AND t.status <> 'ENCERRADO'
    AND (p_projeto_id IS NULL OR t.projeto_id = p_projeto_id)
    AND (p_cliente_id IS NULL OR p.cliente_id = p_cliente_id)
    AND (p_data_inicio IS NULL OR t.criado_em >= p_data_inicio)
    AND (p_data_fim IS NULL OR t.criado_em <= p_data_fim)
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
    )
);
