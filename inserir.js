require('dotenv').config();
const axios = require('axios');
const { Pool } = require('pg');
const { faker } = require('@faker-js/faker');

// Configuração do banco de dados PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Endpoint correto da API da LizeEdu
const API_URL = "https://staging.lizeedu.com.br/api/v2/students/";

// Função para buscar os alunos na base de dados
async function buscarAlunosNoBanco() {
    try {
        const query = `
            SELECT unidade, sit, matricula, nome, turma 
            FROM alunos_25_geral 
            ORDER BY unidade, turma;
        `;
        
        const { rows } = await pool.query(query);
        console.log("📄 Alunos encontrados no banco de dados:", rows);
        return rows;
    } catch (error) {
        console.error("❌ Erro ao buscar alunos no banco de dados:", error.message);
    }
}

// Função para gerar dados aleatórios se faltarem informações
function gerarDadosAleatorios(aluno) {
    return {
        name: aluno.nome || faker.name.fullName(),
        email: aluno.email || faker.internet.email(),
        phone: aluno.telefone || faker.phone.number(),
        birth_date: aluno.dataNascimento || faker.date.past(20, new Date(2003, 0, 1)),
        // Adicione outros campos conforme necessário
    };
}

// Função para enviar os dados dos alunos para a plataforma LizeEdu
async function enviarAlunosParaLizeEdu(alunos) {
    try {
        const token = process.env.LIZE_API_TOKEN;
        if (!token) {
            throw new Error("❌ Token da API não encontrado! Configure no arquivo .env");
        }

        const LIZE_API_TOKEN = `Token ${token}`;
        const headers = {
            Authorization: LIZE_API_TOKEN,
            Accept: "application/json",
            "Content-Type": "application/json",
        };

        for (const aluno of alunos) {
            // Verifica se a matrícula é válida (não está na situação 2 ou 4)
            if (aluno.sit === 2 || aluno.sit === 4) continue;

            // Preenche os dados faltantes com dados aleatórios
            const dadosCompletos = gerarDadosAleatorios(aluno);

            const payload = {
                enrollment_number: aluno.matricula, // Usando o campo de matrícula correto
                name: dadosCompletos.name,          // Nome do aluno
                email: dadosCompletos.email,        // Email do aluno
                phone: dadosCompletos.phone,        // Telefone do aluno
                birth_date: dadosCompletos.birth_date, // Data de nascimento do aluno
                // Adicione os outros campos necessários para o LizeEdu
            };

            console.log("📤 Enviando aluno:", payload);

            // Envia os dados para a plataforma LizeEdu
            const response = await axios.post(API_URL, payload, { headers });
            console.log("✅ Aluno enviado com sucesso:", response.data);
        }
    } catch (error) {
        console.error("❌ Erro ao enviar alunos para LizeEdu:", error.response ? error.response.data : error.message);
    }
}

// Função principal
async function sincronizarAlunos() {
    const alunos = await buscarAlunosNoBanco();
    if (alunos && alunos.length > 0) {
        await enviarAlunosParaLizeEdu(alunos);
    }
}

// Executa a sincronização
sincronizarAlunos();
