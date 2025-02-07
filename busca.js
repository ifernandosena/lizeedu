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

// Configuração da API LizeEdu com o prefixo "Token "
const LIZE_API_TOKEN = `Token ${process.env.LIZE_API_TOKEN}`;
console.log("Token utilizado para autenticação:", LIZE_API_TOKEN);  // Verifica o token no console

const API_URL = 'https://staging.lizeedu.com.br/api/v2/students/';
const HEADERS = {
    Authorization: LIZE_API_TOKEN,  // Usa o formato correto com "Token "
    Accept: 'application/json',
    'Content-Type': 'application/json',
};

// Buscar alunos no banco de dados
async function obterAlunosBanco() {
    const query = "SELECT unidade, sit, matricula, nome, turma FROM alunos_25_geral WHERE turma::NUMERIC >= 11900::NUMERIC";
    const { rows } = await pool.query(query);
    return rows;
}

// Buscar alunos cadastrados no LizeEdu
async function obterAlunosAPI() {
    try {
        const response = await axios.get(API_URL, { headers: HEADERS });
        return response.data || [];
    } catch (error) {
        console.error('Erro ao obter alunos da API:', error.response?.data || error.message);
        return [];
    }
}

// Atualizar aluno na API
async function atualizarAluno(id, alunoBanco) {
    try {
        const payload = {
            name: alunoBanco.nome,
            class_id: alunoBanco.turma,
        };
        await axios.put(`${API_URL}${id}/`, payload, { headers: HEADERS });
        console.log(`✅ Aluno ${alunoBanco.nome} atualizado com sucesso!`);
    } catch (error) {
        console.error(`❌ Erro ao atualizar aluno ${alunoBanco.nome}:`, error.response?.data || error.message);
    }
}

// Processar alunos para atualização
async function processarAlunos() {
    const alunosBanco = await obterAlunosBanco();
    const alunosAPI = await obterAlunosAPI();
    const alunosAPIMapeados = new Map(alunosAPI.map(a => [a.external_id, a]));

    for (const aluno of alunosBanco) {
        const alunoAPI = alunosAPIMapeados.get(aluno.matricula.toString());

        if (alunoAPI) {
            if (alunoAPI.class_id !== aluno.turma || alunoAPI.name !== aluno.nome) {
                await atualizarAluno(alunoAPI.id, aluno);
            }
        }
    }
}

// Executar integração
processarAlunos().then(() => {
    console.log('🚀 Processo de atualização finalizado!');
    pool.end();
});
