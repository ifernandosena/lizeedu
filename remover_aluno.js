require('dotenv').config();  // Carregar variáveis de ambiente do arquivo .env
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
const LIZE_API_TOKEN = process.env.LIZE_API_TOKEN;
const API_URL = 'https://app.lizeedu.com.br/api/v2/students/';  // Exemplo de endpoint

// Mapeamento manual das unidades (Banco → API)
const unidades_api = {
  "01": 35022, "02": 35023, "03": 35024, "04": 35025, "05": 35026,
  "06": 35027, "09": 35028, "10": 35029, "11": 35030, "14": 35031,
  "15": 35032, "16": 35033, "17": 35034
};

// Função para fazer requisição para API da LizeEdu
async function criarAlunoNaAPI(aluno) {
  try {
    const response = await axios.post(API_URL, aluno, {
      headers: {
        'Authorization': `Bearer ${LIZE_API_TOKEN}`,
        'Accept': 'application/json',
      }
    });
    console.log('Aluno criado na LizeEdu:', response.data);
  } catch (error) {
    console.error('Erro ao criar aluno na LizeEdu:', error.message);
  }
}

// Função para processar alunos
async function processarAlunos() {
  const pool = new Pool(dbConfig);
  
  try {
    const client = await pool.connect();

    // Buscar alunos com turmas maiores que 11900 e garantir que seja única a combinação unidade + turma
    const res = await client.query(`
      SELECT DISTINCT unidade, turma FROM alunos_25_geral 
      WHERE CAST(turma AS INTEGER) > 11900
    `);
    
    const alunos = res.rows;

    // Processar cada aluno
    for (let aluno of alunos) {
      const { unidade, turma } = aluno;
      const unidadeStr = String(unidade).padStart(2, '0');  // Converte a unidade para formato com 2 dígitos

      const unitId = unidades_api[unidadeStr];
      if (!unitId) {
        console.log(`Unidade ${unidade} não encontrada no mapeamento.`);
        continue;
      }

      // Criar o objeto aluno para enviar para a LizeEdu
      const alunoData = {
        name: `Aluno_${unidadeStr}_${turma}`,  // Nome exemplo, pode ajustar conforme necessário
        unit_id: unitId,
        turma: turma,
      };

      // Criar aluno na API da LizeEdu
      await criarAlunoNaAPI(alunoData);
    }

    // Fechar a conexão com o banco de dados
    client.release();
  } catch (err) {
    console.error('Erro ao processar alunos:', err.message);
  } finally {
    pool.end();
  }
}

// Executar a função
processarAlunos();
