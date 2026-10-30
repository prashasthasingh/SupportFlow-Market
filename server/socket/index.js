const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Seller joins their shop room to receive new order notifications
    socket.on('join_seller_room', ({ shopId }) => {
      if (shopId) {
        socket.join(`seller_${shopId}`);
        console.log(`[Socket] Seller joined room: seller_${shopId}`);
      }
    });

    // Buyer joins an order room to receive live status updates
    socket.on('join_order_room', ({ orderId }) => {
      if (orderId) {
        socket.join(`order_${orderId}`);
        console.log(`[Socket] Buyer joined order room: order_${orderId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = setupSocket;
