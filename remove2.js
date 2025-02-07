require('dotenv').config();  
const axios = require('axios');
const { Pool } = require('pg');

// Configuração do banco de dados PostgreSQL
const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

// Configuração da API da LizeEdu
const LIZE_API_TOKEN = `Token ${process.env.LIZE_API_TOKEN}`;  // Garante o formato correto do token
console.log("Token utilizado para autenticação:", LIZE_API_TOKEN);  // Log para depuração

const API_URL = 'https://staging.lizeedu.com.br/api/v2/coordinations/members/';  // Endpoint correto

// Função para remover um membro da API da LizeEdu
async function removerMembroDaAPI(idMembro) {
  try {
    const response = await axios.delete(`${API_URL}${idMembro}/remove/`, {
      headers: {
        'Authorization': LIZE_API_TOKEN,
        'Accept': 'application/json',
      }
    });
    console.log(`✅ Membro com ID ${idMembro} removido com sucesso:`, response.data);
  } catch (error) {
    console.error(`❌ Erro ao remover membro com ID ${idMembro}:`, error.response?.data || error.message);
  }
}

// Função para processar a remoção dos membros
async function processarRemocaoMembros() {
  const pool = new Pool(dbConfig);

  try {
    const client = await pool.connect();

    // Buscar membros que precisam ser removidos (exemplo: membros com status 'inativo')
    const res = await client.query(`SELECT id FROM membros WHERE status = 'inativo'`);

    const membros = res.rows;

    // Processar cada membro para remover
    for (let membro of membros) {
      const { id } = membro;
      await removerMembroDaAPI(id);
    }

    // Fechar a conexão com o banco de dados
    client.release();
  } catch (err) {
    console.error('❌ Erro ao processar remoção de membros:', err.message);
  } finally {
    pool.end();
  }
}

// Executar a função para remover membros
processarRemocaoMembros().then(() => {
  console.log('🚀 Processo de remoção finalizado!');
});
