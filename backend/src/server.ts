import http from 'http';
import app from './app';
import { Server } from 'socket.io';
import { prisma } from './config/prisma';
import dotenv from 'dotenv';
import { setupMqtt } from './mqtt';

dotenv.config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
export const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});



// Initialize MQTT
const mqttClient = setupMqtt();

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
    
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
