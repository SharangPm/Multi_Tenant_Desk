import 'dotenv/config';
import http from 'node:http';
import { Server } from 'socket.io';
import app from './app.js';
import connectDB from './config/db.js';
import { configureSockets } from './sockets/index.js';
if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET)
) {
  throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required');
}
await connectDB();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(','),
    credentials: true,
  },
});
configureSockets(io);
app.set('io', io);
const port = process.env.PORT || 4000;
server.listen(port, () => console.log(`ResolveDesk API listening on ${port}`));
