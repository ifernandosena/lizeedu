require('dotenv').config();
const axios = require('axios');
const { Pool } = require('pg');

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

// Função para buscar os alunos na plataforma LizeEdu
async function buscarAlunosLizeEdu() {
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

        console.log("🔄 Buscando alunos da plataforma LizeEdu...");
        const response = await axios.get(API_URL, { headers });

        // Log para verificar toda a estrutura da resposta
        console.log("📄 Estrutura completa da resposta da API:", JSON.stringify(response.data, null, 2));

        // Vamos agora examinar a estrutura dos dados e procurar pelos alunos
        // Exemplo: se os alunos estiverem em response.data.alunos, você ajustaria o código para isso

    } catch (error) {
        console.error("❌ Erro ao buscar alunos da LizeEdu:", error.message);
    }
}

// Executa a integração para buscar os alunos
buscarAlunosLizeEdu();
