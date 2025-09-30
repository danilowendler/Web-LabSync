/**
 * Módulo Principal (Main): O cérebro da aplicação.
 * Este arquivo importa todos os outros módulos e conecta os eventos do usuário
 * à lógica de negócio e às atualizações da interface.
 * Ele configura um listener global que captura entradas de scanners (NFC e QR).
 */

// ======================= IMPORTS =======================
import { state } from './state.js';
// Importamos TODAS as funções da API que o main.js vai usar
import { authenticateUser, fetchItems, submitWithdrawal } from './api.js';
import {
    navigateTo, showToast, updateAllUI, populateSuccessScreen, openItemModal, closeModal,
    modalCloseBtn, itemModalBackdrop, reviewBtn, searchInput, cartSummary
} from './ui.js';

// ======================= FUNÇÕES DE CONTROLE (LÓGICA DE NEGÓCIO) =======================

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
 * Função de atalho para DESENVOLVIMENTO. Simula um scan de login.
 * @param {string} cardCode - O código a ser simulado.
 */
function simulateLogin(cardCode) {
    if (!cardCode) {
        console.error('Simulação falhou: Forneça um cardCode. Ex: simulateLogin("CODIGO")');
        return;
    }
    console.log(`%c 🚀 SIMULANDO scan de login com o código: ${cardCode}`, 'color: #7f00ff; font-weight: bold;');
    handleAuthenticationScan(cardCode);
}

// Renomeamos 'handleScanEvent' para refletir sua função real
async function handleAuthenticationScan(cardCode) {
    showToast(`Lendo crachá ${cardCode}...`, 'info');
    
    try {
        // Agora usamos a função importada no topo do arquivo
        const userData = await authenticateUser(cardCode);
        
        state.currentUser = userData;
        document.getElementById('welcomeMessage').textContent = `Olá, ${state.currentUser.name}`;

        state.isLoading = true;
        navigateTo('screen2');
        updateAllUI(callbacks);

        const itemsFromApi = await fetchItems(state.currentUser.lab);
        
        state.items = itemsFromApi.map(item => ({
            id: item.id,
            name: item.name,
            code: item.eanCode,
            maxStock: item.quantity,
            stock: item.quantity > item.minQuantity ? 'normal' : 'critical',
            imageUrl: item.imageUrl || 'images/placeholder.png',
            quantity: 0
        }));
        
        state.isLoading = false;
        updateAllUI(callbacks);

    } catch (error) {
        showToast(error.message, 'error');
        state.isLoading = false;
        updateAllUI(callbacks);
        navigateTo('screen1'); 
    }
}

async function handleConfirmWithdrawal() {
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
        labId: state.currentUser.lab
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

function handleSuccessfulWithdrawalReset() {
    state.items.forEach(item => item.quantity = 0);
    setTimeout(() => {
        navigateTo('screen5');
    }, 4000);
}

function setupScannerListener() {
    let scannerBuffer = '';
    let lastKeyTime = Date.now();
    console.log('✅ setupScannerListener ativado e ouvindo...'); // Log #1

    document.addEventListener('keydown', (event) => {
        console.log(`Tecla pressionada: '${event.key}'`); // Log #2

        const activeElement = document.activeElement;
        if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
            console.log('➡️ Foco em um input, ignorando captura global...'); // Log #3
            return;
        }

        if (event.key === 'Enter') {
            console.log(`🅿️ 'Enter' pressionado. Buffer atual: "${scannerBuffer}"`); // Log #4
            if (scannerBuffer.length > 2) {
                console.log(`✔️ Buffer válido. Verificando tela atual: "${state.currentScreen}"`); // Log #5
                
                if (state.currentScreen === 'screen1') {
                    console.log('💥 CONDIÇÃO DE LOGIN ATENDIDA! Chamando handleAuthenticationScan...'); // Log #6
                    handleAuthenticationScan(scannerBuffer); 
                } else if (state.currentScreen === 'screen2') {
                    console.log('🛒 CONDIÇÃO DE SCAN DE ITEM ATENDIDA!');
                    searchInput.value = scannerBuffer;
                    searchInput.dispatchEvent(new Event('input'));
                    showToast(`Item ${scannerBuffer} escaneado.`, 'info');
                }
            } else {
                console.log('❌ Buffer muito curto, ignorando.');
            }
            scannerBuffer = '';
            event.preventDefault();
            return;
        }

        if (event.key.length === 1) {
            const now = Date.now();
            if (now - lastKeyTime > 100) { // <--- PONTO CRÍTICO
                console.log('⚠️ Pausa longa detectada (>100ms), limpando o buffer.'); // Log #7
                scannerBuffer = '';
            }
            scannerBuffer += event.key;
            lastKeyTime = now;
            console.log(`Buffer atualizado: "${scannerBuffer}"`); // Log #8
        }
    });
}

const callbacks = {
    onItemAdd: (itemId) => handleChangeQuantity(itemId, 1),
    onCardClick: (itemId) => openItemModal(itemId, handleChangeQuantity),
    onQuantityChange: handleChangeQuantity
};

document.addEventListener('DOMContentLoaded', () => {
    // Ativa o "ouvinte" global de teclado para os scanners
    setupScannerListener();

    // Conecta todos os eventos de clique do usuário
    document.getElementById('startBtn').addEventListener('click', () => navigateTo('screen1'));
    document.getElementById('logoutBtn').addEventListener('click', () => {
        state.currentUser = null;
        state.items = [];
        navigateTo('screen1');
    });
    document.getElementById('cancelReviewBtn').addEventListener('click', () => navigateTo('screen2'));
    document.getElementById('nfcExitIcon').addEventListener('click', () => navigateTo('screen0'));
    document.getElementById('nfcConfirmBtn').addEventListener('click', handleConfirmWithdrawal);
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
    
    // Inicia a aplicação na tela de boas-vindas
    navigateTo('screen0');
});

// js/main.js

// ADICIONE ESTA LINHA NO FINAL DO ARQUIVO
// Isso torna a função simulateLogin acessível no console do navegador para testes
window.simulateLogin = simulateLogin;