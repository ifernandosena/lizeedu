const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public'))); // Serve arquivos HTML da pasta 'public'

// Configuração do PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: '192.168.1.163', // Altere para o seu host
    database: 'DGP', // Altere para o nome do seu banco de dados
    password: 'teste', // Altere para a senha correta
    port: 5432
});

// Rota para buscar os dados filtrados
app.get('/api/log_alocacao', async (req, res) => {
    const { inicio, fim } = req.query;

    // Verifica se as datas de início e fim foram fornecidas
    if (!inicio || !fim) {
        return res.status(400).json({ error: "Datas são obrigatórias." });
    }

    try {
        // Consulta SQL com parâmetros para evitar SQL Injection
        const query = `
            SELECT * FROM public.log_alocacao 
            WHERE quando::timestamp >= $1::timestamp 
            AND quando::timestamp <= $2::timestamp 
            ORDER BY quando DESC
        `;
        const { rows } = await pool.query(query, [inicio, fim]);

        // Retorna os dados encontrados
        res.json(rows);
    } catch (error) {
        console.error("Erro na consulta:", error);
        res.status(500).json({ error: "Erro ao buscar os dados." });
    }
});

// Rota para servir o front-end
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Serve a página HTML principal
});

// Inicia o servidor na porta 3000
app.listen(3000, () => {
    console.log("🚀 Servidor rodando em http://localhost:3000");
});

