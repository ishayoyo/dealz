require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const app = require('./app'); // Import the Express app from app.js
const cron = require('node-cron');
const { cleanupUnusedImages, dealCache } = require('./controllers/dealController'); // Add this line

const PORT = process.env.PORT || 5000;

console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('Current working directory:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);

// Create the server after setting trust proxy in app.js
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["https://saversonic.com", "http://localhost:3000"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true
  },
  path: '/socket.io/', // Explicitly set the path
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket'], // Remove polling to prevent ECONNRESET
  allowEIO3: true,
  maxHttpBufferSize: 1e8, // 100 MB
  connectTimeout: 45000,
  // Add these new settings
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  cookie: {
    name: "socket.io",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === 'production'
  }
});

// Add heartbeat mechanism
setInterval(() => {
  io.sockets.emit('ping');
}, 25000);

// Add error handling for socket connections
io.engine.on("connection_error", (err) => {
  console.log('Socket connection error:', err);
});

const testRoutes = require('./routes/testRoutes')(io);

io.on('connection', (socket) => {
  console.log('New client connected', socket.id);
  
  // Add error handling for individual sockets
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.on('join', ({ userId }) => {
    if (!userId) {
      console.error('Join attempt without userId');
      return;
    }
    console.log(`User ${userId} joining room`);
    socket.join(userId);
    socket.emit('joined', { userId }); // Confirm join
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });

  socket.on('authenticate', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} authenticated`);
  });

  socket.on('ping', () => {
    console.log('Received ping from', socket.id);
    socket.emit('pong');
  });

  socket.on('testConnection', (data) => {
    console.log('Received test connection from client', socket.id, data);
    socket.emit('testResponse', { message: 'Connection successful!' });
  });

  socket.on('newDeal', async (data) => {
    // ... existing newDeal logic ...

    // Clear the deals cache
    dealCache.flushAll();
    console.log('Deals cache cleared after new deal creation via socket');
  });

  socket.on('updateDeal', async (data) => {
    // ... existing updateDeal logic ...

    // Clear the deals cache
    dealCache.flushAll();
    console.log('Deals cache cleared after deal update via socket');
  });

  socket.on('deleteDeal', async (data) => {
    // ... existing deleteDeal logic ...

    // Clear the deals cache
    dealCache.flushAll();
    console.log('Deals cache cleared after deal deletion via socket');
  });
});

app.set('io', io);

// Add the test routes to the main app
app.use('/api/test', testRoutes);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    console.log('Connected to database:', mongoose.connection.name);
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    // Comment out the cleanup cron job
    /*
    cron.schedule('0 * * * *', () => {
      console.log('Cron job triggered at:', new Date().toISOString());
      console.log('Running unused image cleanup task');
      cleanupUnusedImages();
    });
    */
  })
  .catch(err => {
    console.error('Could not connect to MongoDB', err);
    console.error('Connection string used:', process.env.MONGODB_URI);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
