document.addEventListener('DOMContentLoaded', () => {

    // ================= STATE (Fonte da Verdade) =================
    const state = {
        items: [],
        isLoading: true,
        currentScreen: 'screen0',
        lastWithdrawal: []
    };
    
    const apiItems = [
        { id: 1, name: 'Agulha Tipo 1', code: 'Cód.001', stock: 'normal', quantity: 0, maxStock: 20, imageUrl: 'images/agulha.webp' },
        { id: 2, name: 'Seringa 5ml', code: 'Cód.006', stock: 'critical', quantity: 0, maxStock: 5, imageUrl: 'images/seringa.webp' },
        { id: 3, name: 'Luva Nitrílica', code: 'Cód.003', stock: 'normal', quantity: 0, maxStock: 50, imageUrl: 'images/luva_nitrilica.webp' },
        { id: 4, name: 'Gaze Estéril', code: 'Cód.004', stock: 'normal', quantity: 0, maxStock: 100, imageUrl: 'images/gaze_esteril.png' },
        { id: 5, name: 'Álcool 70%', code: 'Cód.005', stock: 'normal', quantity: 0, maxStock: 15, imageUrl: 'images/alcool_70.webp' },
        { id: 6, name: 'Esparadrapo', code: 'Cód.007', stock: 'critical', quantity: 0, maxStock: 10, imageUrl: 'images/esparadrapo.jpg' }
    ];

    // ================= DOM SELECTORS =================
    const nfcConfirmBtn = document.getElementById('nfcConfirmBtn'); 
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

    // ================= API SIMULATION =================
    function fetchItems() {
        state.isLoading = true;
        updateAllUI();
        return new Promise(resolve => {
            setTimeout(() => {
                state.items = apiItems.map(item => ({ ...item, quantity: 0 }));
                state.isLoading = false;
                resolve();
            }, 1500);
        });
    }

    function submitWithdrawal() {
        return new Promise((resolve, reject) => {
            showToast('Enviando retirada...', 'info');
            setTimeout(() => {
                if (Math.random() > 0.5) {
                    resolve({ success: true, message: 'Retirada confirmada com sucesso!' });
                } else {
                    reject({ success: false, message: 'Falha de comunicação. Tente novamente.' });
                }
            }, 1000);
        });
    }

    // ================= RENDER FUNCTIONS (UI) =================

    function renderItems(filter = '') {
        itemGrid.innerHTML = '';
        
        if (state.isLoading) {
            renderSkeletons();
            return;
        }

        const filteredItems = state.items.filter(item =>
            item.name.toLowerCase().includes(filter.toLowerCase()) ||
            item.code.toLowerCase().includes(filter.toLowerCase())
        );

        if (filteredItems.length === 0) {
            itemGrid.innerHTML = `<p class="text-center text-muted">Nenhum item encontrado.</p>`;
            return;
        }

        filteredItems.forEach(item => {
            const isSelected = item.quantity > 0;
            const atMaxStock = item.quantity >= item.maxStock;

            const colDiv = document.createElement('div');
            colDiv.className = 'col-12 col-md-6 col-lg-4 mb-4'; // Ajuste de colunas para melhor espaçamento
            colDiv.dataset.itemId = item.id;

            const cardDiv = document.createElement('div');
            cardDiv.className = `card item-card h-100 ${isSelected ? 'border-primary item-card--selected' : ''} ${item.stock === 'critical' ? 'border-danger' : ''}`;
            
            const cardContentWrapper = document.createElement('div');
            cardContentWrapper.className = 'item-card__content-wrapper';

            const img = document.createElement('img');
            img.src = item.imageUrl;
            img.className = 'item-card__image';
            img.alt = item.name;
            
            const cardBody = document.createElement('div');
            cardBody.className = 'card-body';
            
            const title = document.createElement('h5');
            title.className = 'card-title';
            title.textContent = item.name;

            const text = document.createElement('p');
            text.className = 'card-text text-muted';
            text.textContent = item.code;

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
                handleChangeQuantity(item.id, 1);
            });

            cardDiv.addEventListener('click', (e) => {
                if (e.target.tagName !== 'BUTTON') {
                    openItemModal(item.id);
                }
            });

            cardBody.append(title, text, stockInfo, button);
            
            // ATUALIZADO: A imagem (img) agora é adicionada ANTES do corpo do texto (cardBody)
            cardContentWrapper.append(img, cardBody); 
            
            cardDiv.appendChild(cardContentWrapper);
            colDiv.appendChild(cardDiv);
            itemGrid.appendChild(colDiv);
        });
    }

    function renderSkeletons() {
        itemGrid.innerHTML = '';
        for (let i = 0; i < 6; i++) { // Reduzido para 6 para melhor visualização
            const colDiv = document.createElement('div');
            colDiv.className = 'col-12 col-md-6 col-lg-4 mb-4';
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card h-100 skeleton-card';
            
            const wrapperDiv = document.createElement('div');
            wrapperDiv.className = 'item-card__content-wrapper'; // Usa a mesma classe para consistência

            const imgDiv = document.createElement('div');
            imgDiv.className = 'skeleton-card__image';
            
            const bodyDiv = document.createElement('div');
            bodyDiv.className = 'skeleton-card__body';
            
            const line1 = document.createElement('div');
            line1.className = 'skeleton-card__line';
            
            const line2 = document.createElement('div');
            line2.className = 'skeleton-card__line skeleton-card__line--short';
            
            bodyDiv.append(line1, line2);
            wrapperDiv.append(imgDiv, bodyDiv)
            cardDiv.appendChild(wrapperDiv);
            colDiv.appendChild(cardDiv);
            itemGrid.appendChild(colDiv);
        }
    }
    
    function renderReviewScreen() {
        reviewList.innerHTML = '';
        const itemsInCart = state.items.filter(item => item.quantity > 0);
        itemsInCart.forEach(item => {
            const atMaxStock = item.quantity >= item.maxStock;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'd-flex justify-content-between align-items-center mb-3 p-3 bg-white rounded shadow-sm';
            const infoDiv = document.createElement('div');
            const nameH5 = document.createElement('h5');
            nameH5.textContent = item.name;
            const codeP = document.createElement('p');
            codeP.className = 'mb-0 text-muted';
            codeP.textContent = `${item.code} (Máx: ${item.maxStock})`;
            infoDiv.append(nameH5, codeP);
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'd-flex align-items-center gap-2';
            const minusBtn = document.createElement('button');
            minusBtn.className = 'btn btn-outline-danger';
            minusBtn.textContent = '-';
            minusBtn.addEventListener('click', () => handleChangeQuantity(item.id, -1));
            const quantityInput = document.createElement('input');
            quantityInput.type = 'text';
            quantityInput.readOnly = true;
            quantityInput.value = item.quantity;
            quantityInput.className = 'form-control text-center';
            quantityInput.style.width = '60px';
            const plusBtn = document.createElement('button');
            plusBtn.className = 'btn btn-outline-success';
            plusBtn.textContent = '+';
            if (atMaxStock) {
                plusBtn.disabled = true;
            }
            plusBtn.addEventListener('click', () => handleChangeQuantity(item.id, 1));
            controlsDiv.append(minusBtn, quantityInput, plusBtn);
            itemDiv.append(infoDiv, controlsDiv);
            reviewList.appendChild(itemDiv);
        });
    }

    function updateAllUI() {
        const filter = searchInput.value;
        if (state.currentScreen === 'screen2') {
            renderItems(filter);
        } else if (state.currentScreen === 'screen3') {
            renderReviewScreen();
        }
        updateReviewButton();
        updateCartSummary();
    }

    function updateReviewButton() {
        const totalUniqueItems = state.items.filter(item => item.quantity > 0).length;
        reviewBtn.disabled = totalUniqueItems === 0;
        reviewBtn.textContent = `Revisar Itens (${totalUniqueItems})`;
    }

    function updateCartSummary() {
        const totalQuantity = state.items.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = totalQuantity;
        cartBadge.style.display = totalQuantity > 0 ? 'block' : 'none';
    }

    function navigateTo(screenId) {
        document.querySelectorAll('.kiosk-screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
        state.currentScreen = screenId;
        if (screenId === 'screen2' && state.items.length === 0) {
            fetchItems().then(() => {
                updateAllUI();
            });
        }
    }
    
    function showToast(message, type = 'info') {
        const existingToast = document.querySelector(`.toast-notification[data-message="${message}"]`);
        if (existingToast) {
            return;
        }
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.textContent = message;
        toast.dataset.message = message;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('closing');
            toast.addEventListener('animationend', () => toast.remove());
        }, 4000);
    }

    function openItemModal(itemId) {
        const item = state.items.find(i => i.id === itemId);
        if (!item) return;
        modalBody.innerHTML = '';
        const atMaxStock = item.quantity >= item.maxStock;
        const title = document.createElement('h2');
        title.className = 'text-center mb-2';
        title.textContent = item.name;
        const code = document.createElement('p');
        code.className = 'text-center text-muted mt-0';
        code.textContent = `${item.code} | Em estoque: ${item.maxStock}`;
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'd-flex align-items-center justify-content-center gap-3 my-4';
        const minusBtn = document.createElement('button');
        minusBtn.className = 'btn btn-lg btn-outline-danger';
        minusBtn.textContent = '-';
        minusBtn.addEventListener('click', () => handleChangeQuantity(item.id, -1, true));
        const quantityDisplay = document.createElement('span');
        quantityDisplay.id = 'modalQuantityDisplay';
        quantityDisplay.className = 'h2 fw-bold mx-3';
        quantityDisplay.textContent = item.quantity;
        const plusBtn = document.createElement('button');
        plusBtn.id = 'modalPlusBtn';
        plusBtn.className = 'btn btn-lg btn-outline-success';
        plusBtn.textContent = '+';
        if (atMaxStock) {
            plusBtn.disabled = true;
        }
        plusBtn.addEventListener('click', () => handleChangeQuantity(item.id, 1, true));
        controlsDiv.append(minusBtn, quantityDisplay, plusBtn);
        modalBody.append(title, code, controlsDiv);
        itemModal.classList.add('active');
        itemModalBackdrop.classList.add('active');
    }

    function closeModal() {
        itemModal.classList.remove('active');
        itemModalBackdrop.classList.remove('active');
    }

    function updateModalUI(item) {
        const quantityDisplay = document.getElementById('modalQuantityDisplay');
        const plusBtn = document.getElementById('modalPlusBtn');
        if (quantityDisplay && plusBtn) {
            quantityDisplay.textContent = item.quantity;
            plusBtn.disabled = item.quantity >= item.maxStock;
        }
    }
    
    function handleChangeQuantity(itemId, delta) {
        const item = state.items.find(i => i.id === itemId);
        if (!item) return;
        const newQuantity = item.quantity + delta;
        if (newQuantity < 0 || newQuantity > item.maxStock) {
            return;
        }
        const quantityAdded = newQuantity > item.quantity;
        item.quantity = newQuantity;
        if (itemModal.classList.contains('active')) {
            updateModalUI(item);
        }
        updateAllUI();
        if (quantityAdded) {
            cartSummary.classList.add('animate-shake');
            cartSummary.addEventListener('animationend', () => {
                cartSummary.classList.remove('animate-shake');
            }, { once: true });
            const cardElement = document.querySelector(`[data-item-id="${item.id}"] .item-card`);
            if (cardElement) {
                cardElement.classList.add('animate-flash');
                cardElement.addEventListener('animationend', () => {
                    cardElement.classList.remove('animate-flash');
                }, { once: true });
            }
        }
    }

    function handleSuccessfulWithdrawal() {
        state.items.forEach(item => item.quantity = 0);
        setTimeout(() => {
            navigateTo('screen5');
        }, 4000);
    }

    async function handleConfirmWithdrawal() {
        nfcConfirmBtn.disabled = true;
        try {
            const response = await submitWithdrawal();
            showToast(response.message, 'success');
            const withdrawnItems = state.items.filter(item => item.quantity > 0);
            const totalItems = withdrawnItems.reduce((sum, item) => sum + item.quantity, 0);
            state.lastWithdrawal = withdrawnItems;
            totalItemsText.textContent = totalItems;
            withdrawalItemsList.innerHTML = '';
            state.lastWithdrawal.forEach(item => {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.innerHTML = `<span>${item.name}</span> <span class="badge bg-primary rounded-pill">${item.quantity}</span>`;
                withdrawalItemsList.appendChild(li);
            });
            navigateTo('screen4');
            handleSuccessfulWithdrawal();
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            nfcConfirmBtn.disabled = false;
        }
    }
    
    // ================= EVENT LISTENERS SETUP =================
    document.getElementById('startBtn').addEventListener('click', () => navigateTo('screen1'));
    document.getElementById('logoutBtn').addEventListener('click', () => navigateTo('screen1'));
    document.getElementById('nfcAuthIcon').addEventListener('click', () => navigateTo('screen2'));
    reviewBtn.addEventListener('click', () => {
        renderReviewScreen();
        navigateTo('screen3');
    });
    document.getElementById('cancelReviewBtn').addEventListener('click', () => {
        navigateTo('screen2');
    });
    nfcConfirmBtn.addEventListener('click', handleConfirmWithdrawal);
    document.getElementById('nfcExitIcon').addEventListener('click', () => navigateTo('screen0'));
    searchInput.addEventListener('input', (e) => renderItems(e.target.value));
    cartSummary.addEventListener('click', () => {
        if (state.items.some(item => item.quantity > 0)) {
            renderReviewScreen();
            navigateTo('screen3');
        }
    });
    modalCloseBtn.addEventListener('click', closeModal);
    itemModalBackdrop.addEventListener('click', closeModal);

    // ================= INITIAL RENDER =================
    navigateTo('screen0');
    updateReviewButton();
    updateCartSummary();
});