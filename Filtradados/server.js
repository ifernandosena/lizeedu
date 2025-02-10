const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static(__dirname)); // Servir arquivos HTML

const pool = new Pool({
    user: 'postgres',
    host: '192.168.1.163',
    database: 'DGP',
    password: 'teste',
    port: 5432
});

// Rota para buscar os dados filtrados
app.get('/api/log_alocacao', async (req, res) => {
    const { inicio, fim } = req.query;
    if (!inicio || !fim) {
        return res.status(400).json({ error: "Datas são obrigatórias." });
    }

    try {
        const query = `
            SELECT * FROM public.log_alocacao 
            WHERE quando::timestamp >= $1::timestamp 
            AND quando::timestamp <= $2::timestamp 
            ORDER BY quando DESC
        `;
        const { rows } = await pool.query(query, [inicio, fim]);
        res.json(rows);
    } catch (error) {
        console.error("Erro na consulta:", error);
        res.status(500).json({ error: "Erro ao buscar os dados." });
    }
});

// Inicia o servidor na porta 3000
app.listen(3000, () => console.log("🚀 Servidor rodando em http://localhost:3000"));
