const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(require('cors')());
app.use(express.json());

// API: Get Feed
app.get('/api/posts', async (req, res) => {
  const result = await pool.query('SELECT posts.*, clubs.name as club_name FROM posts JOIN clubs ON posts.club_id = clubs.id ORDER BY created_at DESC');
  res.json(result.rows);
});

// Real-time: Socket.io logic
io.on('connection', (socket) => {
  socket.on('new_post', (post) => {
    io.emit('display_post', post); // Broadcast to all students
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server on ${PORT}`));