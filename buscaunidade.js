require('dotenv').config();
const axios = require('axios');

// Endpoint para consultar unidades da plataforma LizeEdu
const UNIDADES_API_URL = "https://staging.lizeedu.com.br/api/v2/units/";

async function buscarUnidadesLizeEdu() {
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

        console.log("🔄 Buscando unidades da plataforma LizeEdu...");
        const response = await axios.get(UNIDADES_API_URL, { headers });

        // Log para verificar toda a estrutura da resposta
        console.log("📄 Estrutura completa da resposta da API:", JSON.stringify(response.data, null, 2));

        // Se necessário, aqui você pode iterar sobre as unidades e processá-las
        if (response.data && response.data.units) {
            response.data.units.forEach((unidade) => {
                console.log(`ID da Unidade: ${unidade.id}, Nome da Unidade: ${unidade.name}`);
            });
        }

    } catch (error) {
        console.error("❌ Erro ao buscar unidades da LizeEdu:", error.message);
    }
}

// Executa a consulta de unidades
buscarUnidadesLizeEdu();
