require('dotenv').config();
const axios = require('axios');

const API_URL = "https://app.lizeedu.com.br/api/v2/students";

async function atualizarAluno(student_id, nome, email, class_id, external_id) {
    try {
        const token = process.env.LIZE_API_TOKEN;

        if (!token) {
            throw new Error("Token da API não encontrado! Configure no arquivo .env");
        }

        const headers = {
            Authorization: `Bearer ${token}`,
            Accept: "application/json"
        };

        const payload = {
            student_id,
            ...(nome && { name: nome }),
            ...(email && { email }),
            ...(class_id && { class_id }),
            ...(external_id && { external_id })
        };

        const response = await axios.put(`${API_URL}/${student_id}`, payload, { headers });
        console.log(`✅ Aluno atualizado com sucesso!`, response.data);
    } catch (error) {
        console.error(`❌ Erro ao atualizar aluno:`, error.response?.data || error.message);
    }
}

// 🔹 Exemplo de uso
atualizarAluno(12345, "Novo Nome", "novoemail@email.com", 5678, "2025001");
