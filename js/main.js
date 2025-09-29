/**
 * Módulo Principal (Main): O cérebro da aplicação.
 * Este arquivo importa todos os outros módulos e conecta os eventos do usuário
 * à lógica de negócio e às atualizações da interface.
 * Ele inicia a conexão WebSocket e reage às mensagens enviadas pelo backend.
 */

// ======================= IMPORTS =======================

import { state } from './state.js';
import { fetchItems, submitWithdrawal } from './api.js';
import {
    navigateTo,
    showToast,
    updateAllUI,
    populateSuccessScreen,
    openItemModal,
    closeModal,
    modalCloseBtn,
    itemModalBackdrop,
    reviewBtn,
    searchInput,
    cartSummary
} from './ui.js';
import { connectWebSocket } from './websocket.js'; // Nosso novo módulo de conexão

// ======================= FUNÇÕES DE CONTROLE (LÓGICA DE NEGÓCIO) =======================

/**
 * Lida com a mudança de quantidade de um item, atualiza o state e a UI.
 * @param {number} itemId - O ID do item a ser alterado.
 * @param {number} delta - A mudança na quantidade (+1 ou -1).
 */
function handleChangeQuantity(itemId, delta) {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return;

    const newQuantity = item.quantity + delta;
    if (newQuantity < 0 || newQuantity > item.maxStock) {
        return;
    }
    item.quantity = newQuantity;
    updateAllUI(callbacks);
}

/**
 * NOVA FUNÇÃO: Chamada quando o backend nos envia dados do usuário via WebSocket.
 * @param {object} userData - O payload (UserDTO) enviado pelo backend.
 */
async function handleScanEvent(payload) { // Renomeei para 'payload' para ficar mais claro
    
    // 1. Verificamos o status e se a propriedade 'data' existe
    if (payload.status === 'SUCCESS' && payload.data) {
        
        // 2. "Desempacotamos" o objeto do usuário de dentro da propriedade 'data'
        const userData = payload.data; 

        showToast(`Crachá de ${userData.name} recebido!`, 'success');
        try {
            state.currentUser = userData;
            document.getElementById('welcomeMessage').textContent = `Olá, ${state.currentUser.name}`;

            // 3. Agora, state.currentUser.lab será o objeto {id: 1}, então pegamos o id
            const itemsFromApi = await fetchItems(state.currentUser.lab);
            state.items = itemsFromApi.map(item => ({ ...item, quantity: 0 }));
            
            navigateTo('screen2');
            updateAllUI(callbacks);

        } catch (error) {
            showToast(error.message, 'error');
            navigateTo('screen1'); // Volta para a tela de login em caso de erro
        }
    } else {
        // 4. Lidamos com o caso de erro enviado pelo backend
        showToast(payload.message || 'Crachá inválido ou erro no sistema.', 'error');
    }
}
/**
 * Orquestra o fluxo de confirmação e submissão da retirada.
 */
async function handleConfirmWithdrawal() {
    // (Esta função permanece exatamente como estava na versão anterior)
    const nfcConfirmBtn = document.getElementById('nfcConfirmBtn');
    nfcConfirmBtn.disabled = true;

    const itemsInCart = state.items.filter(item => item.quantity > 0);
    if (itemsInCart.length === 0) {
        showToast('Nenhum item selecionado para retirada.', 'info');
        nfcConfirmBtn.disabled = false;
        return;
    }

    const payload = itemsInCart.map(item => ({
        id: item.id,
        takeQuantity: item.quantity,
        labId: state.currentUser.lab.id
    }));

    try {
        await submitWithdrawal(payload);
        showToast('Retirada confirmada com sucesso!', 'success');
        
        state.lastWithdrawal = [...itemsInCart];
        populateSuccessScreen();
        navigateTo('screen4');
        
        handleSuccessfulWithdrawalReset();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        nfcConfirmBtn.disabled = false;
    }
}

/**
 * Reseta o estado do carrinho após uma retirada bem-sucedida e navega para a tela final.
 */
function handleSuccessfulWithdrawalReset() {
    // (Esta função permanece exatamente como estava na versão anterior)
    state.items.forEach(item => item.quantity = 0);
    setTimeout(() => {
        navigateTo('screen5');
    }, 4000);
}

// Callbacks para serem passados para o módulo UI
const callbacks = {
    onItemAdd: (itemId) => handleChangeQuantity(itemId, 1),
    onCardClick: (itemId) => openItemModal(itemId, handleChangeQuantity),
    onQuantityChange: handleChangeQuantity
};


// ======================= EVENT LISTENERS SETUP =======================

document.addEventListener('DOMContentLoaded', () => {
    // 1. INICIA A CONEXÃO WEBSOCKET E DIZ QUAL FUNÇÃO EXECUTAR QUANDO UMA MENSAGEM CHEGAR
    connectWebSocket(handleScanEvent);

    // 2. CONFIGURA TODOS OS OUTROS EVENTOS DE INTERAÇÃO DO USUÁRIO
    
    // Navegação inicial e entre telas
    document.getElementById('startBtn').addEventListener('click', () => navigateTo('screen1'));
    document.getElementById('logoutBtn').addEventListener('click', () => {
        // Ao sair, limpamos o usuário e voltamos para a tela de login
        state.currentUser = null;
        state.items = [];
        navigateTo('screen1');
    });
    document.getElementById('cancelReviewBtn').addEventListener('click', () => navigateTo('screen2'));
    document.getElementById('nfcExitIcon').addEventListener('click', () => navigateTo('screen0'));

    // Ações principais do fluxo
    // A autenticação agora é feita pelo WebSocket, então o listener de clique foi removido.
    // Mantemos apenas a confirmação.
    document.getElementById('nfcConfirmBtn').addEventListener('click', handleConfirmWithdrawal);

    // Navegação para a tela de revisão
    reviewBtn.addEventListener('click', () => {
        navigateTo('screen3');
        updateAllUI(callbacks);
    });
    cartSummary.addEventListener('click', () => {
        if (state.items.some(item => item.quantity > 0)) {
            navigateTo('screen3');
            updateAllUI(callbacks);
        }
    });

    searchInput.addEventListener('input', () => updateAllUI(callbacks));

    modalCloseBtn.addEventListener('click', closeModal);
    itemModalBackdrop.addEventListener('click', closeModal);
    
    navigateTo('screen0');
});