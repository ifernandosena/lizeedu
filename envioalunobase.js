require('dotenv').config(); // Carregar variáveis de ambiente do arquivo .env
const axios = require('axios');
const { Pool } = require('pg');

// Configurações de conexão com o PostgreSQL a partir das variáveis de ambiente
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST, 
  database: process.env.DB_NAME, 
  password: process.env.DB_PASSWORD, 
  port: process.env.DB_PORT, // Lê do .env
});

// Função para buscar os alunos da base de 2025
async function buscarAlunos() {
  const query = 'SELECT unidade, sit, matricula, nome, turma FROM alunos_25_geral ORDER BY unidade, turma';
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar alunos no banco de dados:', error);
    throw error;
  }
}

// Função para inserir o aluno na Lize
async function inserirAlunoNaLize(aluno, token) {
  const url = 'https://api.lizeedu.com/api/v2/students/';
  try {
    const resposta = await axios.post(url, aluno, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('Aluno inserido com sucesso:', resposta.data);
  } catch (error) {
    console.error('Erro ao inserir aluno na Lize:', error.response ? error.response.data : error.message);
  }
}

// Função principal para enviar alunos em lote
async function enviarAlunosEmLote() {
  const token = process.env.LIZE_API_TOKEN; // Lê o token de autenticação do .env
  try {
    const alunos = await buscarAlunos(); // Buscar alunos do banco de dados

    const alunosFormatados = alunos.map(aluno => ({
      name: aluno.nome,
      matricula: aluno.matricula,
      turma: aluno.turma,
      unidade: aluno.unidade,
      sit: aluno.sit,
    }));

    for (const aluno of alunosFormatados) {
      await inserirAlunoNaLize(aluno, token); // Enviar aluno para a Lize
    }

    console.log('Todos os alunos foram inseridos na Lize!');
  } catch (error) {
    console.error('Erro no envio em lote:', error);
  } finally {
    pool.end(); // Fechar conexão com o banco de dados
  }
}

// Executar a função
enviarAlunosEmLote();
