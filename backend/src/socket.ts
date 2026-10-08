import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: '*', // For development, allow any origin. In production, restrict to dashboard URL.
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);

    // Optional: Clients can join a specific classroom room to filter events
    socket.on('join_classroom', (classroom: string) => {
      console.log(`[WS] Client ${socket.id} joined room: ${classroom}`);
      socket.join(classroom);
    });

    socket.on('disconnect', () => {
      console.log(`[WS] Client disconnected: ${socket.id}`);
    });
  });

  console.log('[WS] Socket.io initialized');
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

/**
 * Emits an attendance event to connected clients.
 * If classroom is provided, it broadcasts only to that room.
 */
export const emitAttendanceUpdate = (data: { studentName: string; studentId: string; status: string; timestamp: string; classroom?: string }) => {
  if (!io) return;
  
  if (data.classroom) {
    io.to(data.classroom).emit('attendance_update', data);
  } else {
    io.emit('attendance_update', data);
  }
};
