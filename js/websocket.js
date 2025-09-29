/**
 * Módulo WebSocket: Responsável por conectar com o servidor via SockJS/STOMP
 * e escutar os eventos de scan.
 */


/**
 * Conecta ao servidor e se inscreve no tópico de eventos de scan.
 * @param {Function} onScanEventCallback - A função a ser chamada quando uma mensagem de scan é recebida.
 */
export function connectWebSocket(onScanEventCallback) {
    // Aponta para o endereço do nosso backend
    const socket = new SockJS('http://74.163.240.8:8080/ws'); 
    const stompClient = Stomp.over(socket);

    stompClient.connect({}, () => {
        console.log(' Conectado ao WebSocket do Backend via STOMP!');
        
        // Se inscreve no tópico que o backend vai usar para transmitir os scans
        stompClient.subscribe('/topic/scan-events', (message) => {
            try {
                const payload = JSON.parse(message.body);
                console.log('📬 Mensagem recebida de /topic/scan-events:', payload);
                // Chama a função que o main.js nos passou, entregando os dados do usuário
                onScanEventCallback(payload);
            } catch (e) {
                console.error("Erro ao processar mensagem do WebSocket:", e);
            }
        });
    }, (error) => {
        // Callback de erro de conexão
        console.error('🔌 Erro ao conectar com o WebSocket:', error);
        // Aqui poderíamos tentar reconectar após um tempo
    });
}