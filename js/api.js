/**
 * Este módulo é responsável por toda a comunicação com a API do backend.
 * Cada função aqui corresponde a uma operação de rede (fetch).
 * Elas não modificam o estado da aplicação diretamente, apenas retornam os dados.
 */

// A variável API_CONFIG é carregada globalmente pelo script config.js no index.html
// Não precisamos importá-la, mas garantimos que ela exista.
if (typeof API_CONFIG === 'undefined') {
  throw new Error("Arquivo de configuração (config.js) não foi carregado.");
}

/**
 * Busca os dados de um usuário na API usando o código do cartão.
 * @param {string} cardCode 
 * @returns {Promise<object>} Os dados do usuário (UserDTO).
 */
export async function authenticateUser(cardCode) {
  const response = await fetch(`${API_CONFIG.BASE_URL}/users/${cardCode}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'vasco': API_CONFIG.API_KEY,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Credencial não reconhecida ou inválida.');
  }

  return await response.json();
}

/**
 * Busca a lista de insumos/itens de um laboratório específico.
 * @param {number | string} labId 
 * @returns {Promise<Array<object>>} Uma lista de itens do estoque.
 */
export async function fetchItems(labId) {
  const response = await fetch(`${API_CONFIG.BASE_URL}/stock/${labId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Não foi possível carregar os itens do estoque.');
  }

  return await response.json();
}

/**
 * Envia a lista de itens retirados para o backend para registrar a operação.
 * @param {object} payload - O objeto completo da requisição, incluindo userId e a lista de itens.
 * @returns {Promise<object>} A resposta de sucesso da API.
 */
export async function submitWithdrawal(payload) {
  // A URL voltou a ser a estática, sem o ID do usuário
  const response = await fetch(`${API_CONFIG.BASE_URL}/stock/take`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'vasco': API_CONFIG.API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Falha ao registrar a retirada.');
  }

  return await response.json();
}