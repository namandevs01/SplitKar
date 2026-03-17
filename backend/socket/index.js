const jwt = require('jsonwebtoken');
const { initEmitter } = require('./emitter');

const setupSocket = (io) => {
  initEmitter(io);

  // Auth middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication error: No token'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: user ${socket.userId}`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Join group rooms
    socket.on('join_group', (groupId) => {
      socket.join(`group:${groupId}`);
      console.log(`👥 User ${socket.userId} joined group room ${groupId}`);
    });

    socket.on('leave_group', (groupId) => {
      socket.leave(`group:${groupId}`);
    });

    // Typing indicator for group chat/comments
    socket.on('typing', ({ groupId }) => {
      socket.to(`group:${groupId}`).emit('user_typing', { userId: socket.userId });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: user ${socket.userId}`);
    });
  });
};

module.exports = setupSocket;
