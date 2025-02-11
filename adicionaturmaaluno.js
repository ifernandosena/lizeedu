require('dotenv').config();
const axios = require('axios');

// Função para atribuir turma ao aluno
async function atribuirTurmaAoAluno(alunoId, turmaId) {
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

        // Endpoint para atribuir a turma ao aluno
        const endpoint = `https://staging.lizeedu.com.br/api/v2/students/${alunoId}/set_classes/`;

        // Monta o payload com o ID da turma (no formato correto)
        const payload = {
            school_classes: [turmaId]  // Passando a turma em um array
        };

        console.log("📤 Atribuindo turma ao aluno...");

        const response = await axios.post(endpoint, payload, { headers });

        // Resposta do servidor
        console.log("✅ Turma atribuída ao aluno com sucesso:", response.data);
    } catch (error) {
        console.error("❌ Erro ao atribuir turma ao aluno:", error.response ? error.response.data : error.message);
    }
}

// Função principal para verificar se o aluno não tem turma e atribuir
async function atribuirTurma() {
    const alunoId = 'dfdacce2-5182-4bfe-a1bc-f49e72f23a3c'; // Exemplo de ID do aluno
    const turmaId = 'a8db523e-cc80-43ca-aebe-3f4d5b96735a'; // ID da turma que você obteve

    // Atribui a turma ao aluno
    await atribuirTurmaAoAluno(alunoId, turmaId);
}

// Executa o fluxo
atribuirTurma();
