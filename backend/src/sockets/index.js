import jwt from 'jsonwebtoken';
export function configureSockets(io) {
  io.use((socket, next) => {
    try {
      socket.user = jwt.verify(
        socket.handshake.auth?.token,
        process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
      );
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });
  io.on('connection', (socket) =>
    socket.join(`org:${socket.user.organizationId}`),
  );
}
