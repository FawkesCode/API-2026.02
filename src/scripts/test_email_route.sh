#!/bin/bash

# URL da rota da API
API_URL="http://localhost:3000/api/email"

# Configurações do Banco de Dados baseadas no .env.example
DB_USER="root"
DB_PASS="123456"
DB_NAME="test"
DB_HOST="127.0.0.1" # Usamos 127.0.0.1 no lugar de localhost para forçar a conexão via TCP para o Docker
DB_PORT="3307"

echo "Busca direta no banco de dados MySQL local na porta $DB_PORT..."

# 1. Buscar o Gestor gerado pelo seed
MANAGER_ID=$(mysql -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" -P "$DB_PORT" -D "$DB_NAME" -sN -e "SELECT id FROM usuarios WHERE email='vbomfimcunha@gmail.com' LIMIT 1;")

if [ -z "$MANAGER_ID" ]; then
    echo "❌ Erro: Não foi possível encontrar o Gestor 'vbomfimcunha@gmail.com'."
    echo "Verifique se o banco está rodando na porta $DB_PORT e se o seed foi executado."
    exit 1
fi

echo "✅ Gestor encontrado: $MANAGER_ID"

# 2. Buscar 10 UUIDs na tabela de tickets
echo "Buscando 10 tickets no banco..."
TICKET_LIST=$(mysql -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" -P "$DB_PORT" -D "$DB_NAME" -sN -e "SELECT id FROM tickets LIMIT 10;")

if [ -z "$TICKET_LIST" ]; then
    echo "❌ Erro: Nenhum ticket encontrado no banco de dados."
    exit 1
fi

TICKETS=($TICKET_LIST)
echo "✅ Encontrados ${#TICKETS[@]} tickets."

echo "=========================================="
echo "Iniciando as requisições para $API_URL"
echo "=========================================="

for TICKET_ID in "${TICKETS[@]}"; do
  echo "-> Enviando e-mail do Ticket: $TICKET_ID"
  
  curl -k -X POST "$API_URL" \
       -H "Content-Type: application/json" \
       -d "{\"managerId\": \"$MANAGER_ID\", \"ticketId\": \"$TICKET_ID\"}"
       
  echo -e "\n------------------------------------------"
  
  echo "Aguardando 5 minutos (300 segundos) até o próximo disparo..."
  sleep 300
done

echo "Concluído!"
