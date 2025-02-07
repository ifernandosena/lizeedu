const axios = require('axios');
const { Pool } = require('pg');

// Configuração da API
const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxMzIiLCJqdGkiOiI1MTNhMDdhMDdmMmY4OTI5MWUyMzQ5MTVmMDY5ODIyYWZhNjkxZDAwZGQ2YzZiNjVkM2IyMmY1N2QwNzNmZTEzN2NhMjMxZDc1MmQwMTg3YSIsImlhdCI6MTczNzA1Mjk4Ny40MTIwNDgsIm5iZiI6MTczNzA1Mjk4Ny40MTIwNTIsImV4cCI6MTg5NDgxOTM4Ny40MDM0MDcsInN1YiI6IjMxOSIsInNjb3BlcyI6WyIqIl19.UP9ThFiYOvtjr2JOQuu0nSWzroOz6WmWCnfNK4yhU-j_02pcDT1hukXrgV_FnsCqy37kGgAZVXT-uk2TLr8RWxMww4JXtqLDCdH6uSmQvO2uK1HAutxkoJNFDurIjTcfX2RmbQ4_TD0QUc2pyyHZ9lB9C4nOlOvRLkJIOoyGAa3gUlTHgX8GN5x2ZS_2bxrYPy4ioFDMNTwCi5UG_fXbApmVuXvhc35muacC1TVmuExvGQLpliDsZqNNJgZSVZsqdhFQS4ZrqYMz-pkd0_W0AuCSYxjMKyEAjcd6aEQfkLiGfVzI0EJ19e1Yc-vBG1SxC4Iv7FfhL6H9hahMZ-sQK07Ilbt9vD7k-I-93vvHBmlYIT4A4wC9QqH-z-I0hg64JjYsPLBezqmZOUEmcsan30OFZSlSp2iRkgd4iEnvia41KdkllERkoPPu5o4fq8hQ6dfVvGsqSQ0ZdMRWy0ukWTdAvgExFCh3i7Q6hadvdePrSzNUIrESp4tKpTg5qtVtbaseZNz7IkzpuYbk8tJUolNIterF20nc0leBbk2Qx0cjrrw6Cyzu7AElUxG-vALI5FRmR9jsWT_knrSQaWZaRo1tHrCF0yG19odOjS8Scd-97JTzN-gStji6XyDl5fTQV0uljHS3CqyTFDcWl9ZRk3wI5ITjFgYaiVEIkZ7U5p4";
const HEADERS = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

// Configuração do banco de dados PostgreSQL
const dbConfig = {
    user: 'postgres',
    host: '192.168.1.163',
    database: 'BOLETOS',
    password: 'teste',
    port: 5432,
};

// Mapeamento manual das unidades (Banco → API)
const unidadesApi = {
    "01": 35022, "02": 35023, "03": 35024, "04": 35025, "05": 35026,
    "06": 35027, "09": 35028, "10": 35029, "11": 35030, "14": 35031,
    "15": 35032, "16": 35033, "17": 35034
};

// Função para criar turma na API
async function criarTurma(unitId, nomeTurma) {
    const url = 'https://app.redacaonline.com.br/api/classes';
    const externalId = `${unitId}_${nomeTurma}`;

    const payload = {
        name: nomeTurma,
        unit_id: unitId,
        external_id: externalId,
    };

    try {
        const response = await axios.post(url, payload, { headers: HEADERS });
        if (response.status === 200) {
            const turmaId = response.data.id || 'ID não encontrado';
            console.log(`✅ Turma '${nomeTurma}' criada com sucesso! ID: ${turmaId}`);
            return turmaId;
        } else {
            console.error(`❌ Erro ao criar turma '${nomeTurma}': ${response.status} - ${response.statusText}`);
            return null;
        }
    } catch (error) {
        console.error(`❌ Erro ao criar turma '${nomeTurma}': ${error.message}`);
        return null;
    }
}

// Função para listar turmas existentes na API
async function listarTurmas(unitId) {
    const url = 'https://app.redacaonline.com.br/api/classes';
    try {
        const response = await axios.get(url, { headers: HEADERS, params: { unit_id: unitId } });
        if (response.status === 200) {
            return response.data.reduce((acc, turma) => {
                acc[turma.name] = turma.id;
                return acc;
            }, {});
        } else {
            console.error(`❌ Erro ao listar turmas da unidade ${unitId}: ${response.status} - ${response.statusText}`);
            return {};
        }
    } catch (error) {
        console.error(`❌ Erro ao listar turmas da unidade ${unitId}: ${error.message}`);
        return {};
    }
}

// Função principal para processar alunos e criar turmas se necessário
async function processarAlunos() {
    const pool = new Pool(dbConfig);
    const client = await pool.connect();

    try {
        // Buscar alunos com turmas maiores que 11900 e garantir que seja única a combinação unidade + turma
        const res = await client.query(`
            SELECT DISTINCT unidade, turma FROM alunos_25_geral 
            WHERE CAST(turma AS INTEGER) > 11900
        `);

        const alunos = res.rows;
        const turmasPorUnidade = {};

        // Processar cada aluno
        for (const { unidade, turma } of alunos) {
            const unidadeStr = String(unidade).padStart(2, '0');
            const unitId = unidadesApi[unidadeStr];

            if (!unitId) {
                console.log(`❌ Unidade ${unidade} não encontrada no mapeamento.`);
                continue;
            }

            // Verificar se já consultamos as turmas dessa unidade
            if (!turmasPorUnidade[unidadeStr]) {
                turmasPorUnidade[unidadeStr] = await listarTurmas(unitId);
            }

            const turmasApi = turmasPorUnidade[unidadeStr];

            // Se a turma não existir na API, cria a turma
            if (!turmasApi[turma]) {
                const turmaId = await criarTurma(unitId, turma);
                if (turmaId) {
                    turmasApi[turma] = turmaId; // Atualiza o dicionário local com o ID da turma
                }
            }

            console.log(`🔹 Turma '${turma}' já existe ou foi criada com ID: ${turmasApi[turma] || 'Erro ao obter ID'}`);
        }
    } catch (error) {
        console.error('❌ Erro ao processar alunos:', error.message);
    } finally {
        client.release();
        pool.end();
    }
}

// Executar o processo
processarAlunos();
