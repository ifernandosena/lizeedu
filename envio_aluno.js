require('dotenv').config();
const axios = require('axios');

// Endpoint correto da API
const API_URL = "https://staging.lizeedu.com.br/api/v2/students/";

// Função para atualizar um aluno
async function atualizarAluno(student_id, nome, email, class_id, external_id) {
    try {
        const token = process.env.LIZE_API_TOKEN;

        if (!token) {
            throw new Error("❌ Token da API não encontrado! Configure no arquivo .env");
        }

        // Corrigindo o formato do token
        const LIZE_API_TOKEN = `Token ${token}`;

        const headers = {
            Authorization: LIZE_API_TOKEN,
            Accept: "application/json",
            "Content-Type": "application/json",
        };

        const payload = {
            ...(nome && { name: nome }),
            ...(email && { email }),
            ...(class_id && { class_id }),
            ...(external_id && { external_id }),
        };

        console.log(`🔄 Atualizando aluno ID ${student_id} com payload:`, payload);

        const response = await axios.put(`${API_URL}${student_id}/`, payload, { headers });

        console.log(`✅ Aluno atualizado com sucesso!`, response.data);
    } catch (error) {
        console.error(`❌ Erro ao atualizar aluno ${student_id}:`, error.response?.data || error.message);
    }
}

// 🔹 Exemplo de uso
atualizarAluno(12345, "Novo Nome", "novoemail@email.com", 5678, "2025001");
