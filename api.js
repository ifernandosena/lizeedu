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
//https://staging.lizeedu.com.br/api/v2/students
// Configuração da API LizeEdu
const API_URL = 'https://staging.lizeedu.com.br/api/v2/students/';
const HEADERS = {
    Authorization: `Bearer ${process.env.LIZE_API_TOKEN}`,
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

// Inserir aluno na API
async function inserirAluno(aluno) {
    try {
        const payload = {
            name: aluno.nome,
            email: `${aluno.matricula}@alunos.smrede.com.br`,
            class_id: aluno.turma,
            external_id: aluno.matricula.toString(),
        };
        const response = await axios.post(API_URL, payload, { headers: HEADERS });
        console.log(`Aluno ${aluno.nome} inserido com sucesso! ID:`, response.data.id);
    } catch (error) {
        console.error(`Erro ao inserir aluno ${aluno.nome}:`, error.response?.data || error.message);
    }
}

// Atualizar aluno na API
async function atualizarAluno(alunoAPI, alunoBanco) {
    try {
        const payload = {
            name: alunoBanco.nome,
            class_id: alunoBanco.turma,
        };
        await axios.put(`${API_URL}${alunoAPI.id}/`, payload, { headers: HEADERS });
        console.log(`Aluno ${alunoBanco.nome} atualizado com sucesso!`);
    } catch (error) {
        console.error(`Erro ao atualizar aluno ${alunoBanco.nome}:`, error.response?.data || error.message);
    }
}

// Remover aluno da API
async function removerAluno(aluno) {
    try {
        await axios.delete(`${API_URL}${aluno.id}/`, { headers: HEADERS });
        console.log(`Aluno ${aluno.name} removido com sucesso!`);
    } catch (error) {
        console.error(`Erro ao remover aluno ${aluno.name}:`, error.response?.data || error.message);
    }
}

// Processar alunos
async function processarAlunos() {
    const alunosBanco = await obterAlunosBanco();
    const alunosAPI = await obterAlunosAPI();
    const alunosAPIMapeados = new Map(alunosAPI.map(a => [a.external_id, a]));

    for (const aluno of alunosBanco) {
        const alunoAPI = alunosAPIMapeados.get(aluno.matricula.toString());

        if (!alunoAPI) {
            await inserirAluno(aluno);
        } else if (alunoAPI.class_id !== aluno.turma || alunoAPI.name !== aluno.nome) {
            await atualizarAluno(alunoAPI, aluno);
        }
    }

    // Remover alunos que estão na API, mas não no banco
    for (const aluno of alunosAPI) {
        if (!alunosBanco.some(a => a.matricula.toString() === aluno.external_id)) {
            await removerAluno(aluno);
        }
    }
}

// Executar integração
processarAlunos().then(() => {
    console.log('✅ Processo de integração finalizado!');
    pool.end();
});
