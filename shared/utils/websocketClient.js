const WebSocket = require('ws');
function connectWebSocketClient(url) {
    const socket = new WebSocket(url);

    socket.on('open', () => {
        console.log('Connected to WebSocket');
        // Gửi thông điệp thử nghiệm
        socket.send(JSON.stringify({ success: true, message: 'Test friend request' }));
    });

    socket.on('message', (data) => {
        console.log('Received from server:', data);
    });

    socket.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    socket.on('close', () => {
        console.log('Disconnected from WebSocket');
    });
}
module.exports = connectWebSocketClient;
