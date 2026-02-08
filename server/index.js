import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';

import expenseRoutes from './routes/expenses.js';
import groupRoutes from './routes/groups.js';
import friendRoutes from './routes/friends.js';
import userRoutes from './routes/users.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const frontendOrigin = [
    process.env.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
].filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: frontendOrigin,
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use(cors({
    origin: frontendOrigin
}));
app.use(express.json());

// Pass io to routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Socket logic
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_room', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their private room`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Routes
app.use('/api/expenses', expenseRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/users', userRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        dbState: mongoose.connection.readyState,
        allowedOrigins: frontendOrigin
    });
});

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI;
console.log('Connecting to MongoDB...');

mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
})
    .then(() => {
        console.log('=========================================');
        console.log('✅ Successfully connected to MongoDB Atlas');
        console.log('=========================================');
    })
    .catch((err) => {
        console.error('\n\n=========================================');
        console.error('❌ CRITICAL ERROR: COULD NOT CONNECT TO DATABASE');
        console.error('=========================================');
        console.error('REASON:', err.message);
        console.error('\nMOST LIKELY CAUSE: IP Whitelist Issue');
        console.error('Go to MongoDB Atlas -> Network Access -> Add Current IP');
        console.error('Official Docs: https://www.mongodb.com/docs/atlas/security-whitelist/');
        console.error('=========================================\n\n');
        process.exit(1);
    });

mongoose.connection.on('error', err => {
    console.error('Mongoose runtime error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('Mongoose disconnected');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
