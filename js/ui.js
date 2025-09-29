/**
 * Módulo UI: Responsável por toda a manipulação do DOM.
 * Ele lê o estado da aplicação do módulo 'state.js' para renderizar a interface
 * e exporta funções para serem chamadas pelo 'main.js'.
 */

import { state } from './state.js';

// ======================= DOM SELECTORS =======================
// Centralizamos todas as referências a elementos do DOM aqui.
const itemGrid = document.getElementById('itemGrid');
const reviewBtn = document.getElementById('reviewBtn');
const reviewList = document.getElementById('reviewList');
const searchInput = document.getElementById('searchInput');
const cartSummary = document.getElementById('cartSummary');
const cartBadge = document.getElementById('cartBadge');
const itemModalBackdrop = document.getElementById('itemModalBackdrop');
const itemModal = document.getElementById('itemModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalBody = document.getElementById('modalBody');
const toastContainer = document.getElementById('toastContainer');
const totalItemsText = document.getElementById('totalItemsText');
const withdrawalItemsList = document.getElementById('withdrawalItemsList');

export {
    itemGrid,
    reviewBtn,
    reviewList,
    searchInput,
    cartSummary,
    cartBadge,
    itemModalBackdrop,
    itemModal,
    modalCloseBtn,
    modalBody,
    toastContainer,
    totalItemsText,
    withdrawalItemsList
};

// ======================= RENDER FUNCTIONS =======================

/**
 * Renderiza os cards de itens no grid principal.
 * @param {Function} onItemAdd - Callback para quando o botão 'Adicionar' é clicado (itemId).
 * @param {Function} onCardClick - Callback para quando o card é clicado (itemId).
 */
export function renderItems(onItemAdd, onCardClick) {
  const filter = searchInput.value.toLowerCase();
  itemGrid.innerHTML = '';

  const filteredItems = state.items.filter(item =>
    item.name.toLowerCase().includes(filter) ||
    (item.code && item.code.toLowerCase().includes(filter))
  );

  if (filteredItems.length === 0 && !state.isLoading) {
    itemGrid.innerHTML = `<p class="text-center text-muted col-12">Nenhum item encontrado.</p>`;
    return;
  }

  filteredItems.forEach(item => {
    const isSelected = item.quantity > 0;
    const atMaxStock = item.quantity >= item.maxStock;

    const colDiv = document.createElement('div');
    colDiv.className = 'col-12 col-md-6 col-lg-4 mb-4';

    const cardDiv = document.createElement('div');
    cardDiv.className = `card item-card h-100 ${isSelected ? 'border-primary item-card--selected' : ''} ${item.stock === 'critical' ? 'border-danger' : ''}`;
    cardDiv.addEventListener('click', () => onCardClick(item.id));

    const cardContentWrapper = document.createElement('div');
    cardContentWrapper.className = 'item-card__content-wrapper';

    const img = document.createElement('img');
    img.src = item.imageUrl || 'images/placeholder.png'; // Fallback image
    img.className = 'item-card__image';
    img.alt = item.name;

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    const title = document.createElement('h5');
    title.className = 'card-title';
    title.textContent = item.name;

    const text = document.createElement('p');
    text.className = 'card-text text-muted';
    text.textContent = item.code || '';

    const stockInfo = document.createElement('p');
    stockInfo.className = `card-text small ${atMaxStock ? 'text-danger fw-bold' : 'text-muted'}`;
    stockInfo.textContent = `Em estoque: ${item.maxStock}`;

    const button = document.createElement('button');
    button.className = `btn mt-auto ${isSelected ? 'btn-success' : 'btn-outline-primary'}`;
    button.textContent = isSelected ? `Selecionado (${item.quantity})` : 'Adicionar';
    if (atMaxStock) {
        button.textContent = 'Estoque Máx.';
        button.disabled = true;
    }
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!atMaxStock) {
            onItemAdd(item.id);
        }
    });

    cardBody.append(title, text, stockInfo, button);
    cardContentWrapper.append(img, cardBody);
    cardDiv.appendChild(cardContentWrapper);
    colDiv.appendChild(cardDiv);
    itemGrid.appendChild(colDiv);
  });
}

/** Renderiza os skeletons de carregamento. */
export function renderSkeletons() {
    itemGrid.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const colDiv = document.createElement('div');
        colDiv.className = 'col-12 col-md-6 col-lg-4 mb-4';
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card h-100 skeleton-card';
        cardDiv.innerHTML = `
            <div class="item-card__content-wrapper">
                <div class="skeleton-card__image"></div>
                <div class="skeleton-card__body">
                    <div class="skeleton-card__line"></div>
                    <div class="skeleton-card__line skeleton-card__line--short"></div>
                </div>
            </div>
        `;
        colDiv.appendChild(cardDiv);
        itemGrid.appendChild(colDiv);
    }
}

/**
 * Renderiza a lista de itens na tela de revisão.
 * @param {Function} onQuantityChange - Callback para os botões '+' e '-' (itemId, delta).
 */
export function renderReviewScreen(onQuantityChange) {
  reviewList.innerHTML = '';
  const itemsInCart = state.items.filter(item => item.quantity > 0);
  itemsInCart.forEach(item => {
    const atMaxStock = item.quantity >= item.maxStock;
    const itemDiv = document.createElement('div');
    itemDiv.className = 'd-flex justify-content-between align-items-center mb-3 p-3 bg-white rounded shadow-sm';
    
    itemDiv.innerHTML = `
      <div>
        <h5>${item.name}</h5>
        <p class="mb-0 text-muted">${item.code} (Máx: ${item.maxStock})</p>
      </div>
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-outline-danger btn-minus">-</button>
        <input type="text" value="${item.quantity}" class="form-control text-center" style="width: 60px;" readonly>
        <button class="btn btn-outline-success btn-plus" ${atMaxStock ? 'disabled' : ''}>+</button>
      </div>
    `;

    itemDiv.querySelector('.btn-minus').addEventListener('click', () => onQuantityChange(item.id, -1));
    itemDiv.querySelector('.btn-plus').addEventListener('click', () => onQuantityChange(item.id, 1));
    reviewList.appendChild(itemDiv);
  });
}

/** Função central que atualiza todas as partes da UI com base no state. */
export function updateAllUI(callbacks) {
  if (state.isLoading) {
    renderSkeletons();
  } else if (state.currentScreen === 'screen2') {
    renderItems(callbacks.onItemAdd, callbacks.onCardClick);
  } else if (state.currentScreen === 'screen3') {
    renderReviewScreen(callbacks.onQuantityChange);
  }
  updateReviewButton();
  updateCartSummary();
}

// ======================= UI HELPERS =======================

/** Atualiza o estado visual do botão de revisar itens. */
export function updateReviewButton() {
  const totalUniqueItems = state.items.filter(item => item.quantity > 0).length;
  reviewBtn.disabled = totalUniqueItems === 0;
  reviewBtn.textContent = `Revisar Itens (${totalUniqueItems})`;
}

/** Atualiza o contador de itens no ícone do carrinho. */
export function updateCartSummary() {
  const totalQuantity = state.items.reduce((sum, item) => sum + item.quantity, 0);
  cartBadge.textContent = totalQuantity;
  cartBadge.style.display = totalQuantity > 0 ? 'block' : 'none';
}

/** Dispara a animação de 'shake' no ícone do carrinho. */
export function triggerCartAnimation() {
    cartSummary.classList.add('animate-shake');
    cartSummary.addEventListener('animationend', () => cartSummary.classList.remove('animate-shake'), { once: true });
}

/** Altera a tela visível na aplicação. */
export function navigateTo(screenId) {
  document.querySelectorAll('.kiosk-screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
  state.currentScreen = screenId;
}

/** Mostra uma notificação toast na tela. */
export function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('closing');
        toast.addEventListener('animationend', () => toast.remove());
    }, 4000);
}

/** Popula e exibe a tela de sucesso da retirada. */
export function populateSuccessScreen() {
    const withdrawnItems = state.lastWithdrawal;
    const totalItems = withdrawnItems.reduce((sum, item) => sum + item.quantity, 0);
    totalItemsText.textContent = totalItems;
    withdrawalItemsList.innerHTML = '';
    withdrawnItems.forEach(item => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `<span>${item.name}</span> <span class="badge bg-primary rounded-pill">${item.quantity}</span>`;
        withdrawalItemsList.appendChild(li);
    });
}

// ======================= MODAL FUNCTIONS =======================

export function openItemModal(itemId, onQuantityChange) {
  const item = state.items.find(i => i.id === itemId);
  if (!item) return;
  modalBody.innerHTML = '';
  const atMaxStock = item.quantity >= item.maxStock;
  modalBody.innerHTML = `
    <h2 class="text-center mb-2">${item.name}</h2>
    <p class="text-center text-muted mt-0">${item.code} | Em estoque: ${item.maxStock}</p>
    <div class="d-flex align-items-center justify-content-center gap-3 my-4">
        <button class="btn btn-lg btn-outline-danger btn-modal-minus">-</button>
        <span id="modalQuantityDisplay" class="h2 fw-bold mx-3">${item.quantity}</span>
        <button id="modalPlusBtn" class="btn btn-lg btn-outline-success btn-modal-plus" ${atMaxStock ? 'disabled' : ''}>+</button>
    </div>
  `;
  modalBody.querySelector('.btn-modal-minus').addEventListener('click', () => {
      onQuantityChange(item.id, -1);
      updateModalUI(item);
  });
  modalBody.querySelector('.btn-modal-plus').addEventListener('click', () => {
      onQuantityChange(item.id, 1);
      updateModalUI(item);
  });
  itemModal.classList.add('active');
  itemModalBackdrop.classList.add('active');
}

export function closeModal() {
  itemModal.classList.remove('active');
  itemModalBackdrop.classList.remove('active');
}

export function updateModalUI(item) {
  const quantityDisplay = document.getElementById('modalQuantityDisplay');
  const plusBtn = document.getElementById('modalPlusBtn');
  if (quantityDisplay && plusBtn) {
    quantityDisplay.textContent = item.quantity;
    plusBtn.disabled = item.quantity >= item.maxStock;
  }
}