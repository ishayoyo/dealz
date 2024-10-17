require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const app = require('./app'); // Import the Express app from app.js
const cron = require('node-cron');
const { cleanupUnusedImages } = require('./controllers/dealController'); // Add this line

const PORT = process.env.PORT || 5000;

console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('Current working directory:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);

// Create the server after setting trust proxy in app.js
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["https://saversonic.com", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const testRoutes = require('./routes/testRoutes')(io);

io.on('connection', (socket) => {
  console.log('New client connected', socket.id);
  
  socket.on('join', ({ userId }) => {
    console.log(`User ${userId} joining room`);
    socket.join(userId);
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

    // Schedule the cleanup task to run every hour
    cron.schedule('0 * * * *', () => {
      console.log('Cron job triggered at:', new Date().toISOString());
      console.log('Running unused image cleanup task');
      cleanupUnusedImages();
    });
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
