const axios = require('axios');
require('dotenv').config();  // Para carregar as variáveis do arquivo .env

// Usando o token de autenticação armazenado no arquivo .env
const token = process.env.LIZE_API_TOKEN;

// Configuração do cabeçalho com o token
const headers = {
  'Authorization': `Bearer ${token}`,
  'Accept': 'application/json'
};

// Endpoint de status para testar
const endpoint = 'https://app.lizeedu.com.br/api/v2/status';

async function testarApi() {
  try {
    // Fazendo uma requisição GET ao endpoint de status
    const response = await axios.get(endpoint, { headers });

    // Verificando o status e a resposta
    console.log('Resposta da API:', response.data);
  } catch (error) {
    // Caso ocorra um erro, exibe o erro
    if (error.response) {
      // Erro de resposta da API
      console.log('Erro ao fazer requisição:', error.response.status);
      console.log('Detalhes do erro:', error.response.data);
    } else {
      // Erro de configuração da requisição
      console.log('Erro ao fazer requisição:', error.message);
    }
  }
}

// Executar o teste
testarApi();
