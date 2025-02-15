require('dotenv').config();
const axios = require('axios');
const { Pool } = require('pg');

// Configuração do Banco de Dados PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Configuração da API LizeEdu
const API_URL = 'https://staging.lizeedu.com.br/api/v2/students/';
const LIZE_API_TOKEN = `Token ${process.env.LIZE_API_TOKEN}`;

const HEADERS = {
    Authorization: LIZE_API_TOKEN,
    Accept: 'application/json',
    'Content-Type': 'application/json',
};

// Função para buscar alunos no banco de dados
async function obterAlunosBanco() {
    const query = "SELECT unidade, sit, matricula, nome, turma FROM alunos_25_geral WHERE turma::NUMERIC >= 11900::NUMERIC";
    const { rows } = await pool.query(query);
    return rows;
}

// Função para buscar alunos na API
async function obterAlunosAPI() {
    try {
        const response = await axios.get(API_URL, { headers: HEADERS });

        console.log("📡 Resposta da API:", response.data); // Depuração

        if (!Array.isArray(response.data)) {
            console.error("❌ ERRO: A API não retornou uma lista de alunos!");
            return [];
        }

        return response.data;
    } catch (error) {
        console.error('❌ Erro ao obter alunos da API:', error.response?.data || error.message);
        return [];
    }
}

// Função para atualizar aluno na API
async function atualizarAluno(alunoAPI, alunoBanco) {
    try {
        const payload = {
            name: alunoBanco.nome,
            class_id: alunoBanco.turma,
        };

        const url = `${API_URL}${alunoAPI.id}/`;
        console.log(`🔄 Atualizando aluno ${alunoBanco.nome} na URL: ${url}`);

        await axios.put(url, payload, { headers: HEADERS });

        console.log(`✅ Aluno ${alunoBanco.nome} atualizado com sucesso!`);
    } catch (error) {
        console.error(`❌ Erro ao atualizar aluno ${alunoBanco.nome}:`, error.response?.data || error.message);
    }
}

// Função principal para processar atualização dos alunos
async function processarAlunos() {
    const alunosBanco = await obterAlunosBanco();
    const alunosAPI = await obterAlunosAPI();

    if (!Array.isArray(alunosAPI)) {
        console.error("❌ ERRO: alunosAPI não é uma lista!");
        return;
    }

    const alunosAPIMapeados = new Map(alunosAPI.map(a => [a.external_id, a]));

    for (const aluno of alunosBanco) {
        const alunoAPI = alunosAPIMapeados.get(aluno.matricula.toString());

        if (alunoAPI) {
            if (alunoAPI.class_id !== aluno.turma || alunoAPI.name !== aluno.nome) {
                await atualizarAluno(alunoAPI, aluno);
            }
        }
    }
}

// Executar a atualização dos alunos
processarAlunos().then(() => {
    console.log('🚀 Processo de atualização finalizado!');
    pool.end();
});
