let io;

const initEmitter = (socketIo) => {
  io = socketIo;
};

const emitToUser = (userId, event, data) => {
  if (io) io.to(`user:${userId}`).emit(event, data);
};

const emitToGroup = (groupId, event, data) => {
  if (io) io.to(`group:${groupId}`).emit(event, data);
};

module.exports = { initEmitter, emitToUser, emitToGroup };
