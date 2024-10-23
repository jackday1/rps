const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Create the app and server
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

const PORT = 8888;

// Game constants
const ITEM_COUNT = 25;
const RECT_WIDTH = 800;
const RECT_HEIGHT = 600;
const ITEM_SIZE = 20;
const SPEED = 2; // Slow speed for movement

// Types
const TYPES = {
  ROCK: 'rock',
  PAPER: 'paper',
  SCISSORS: 'scissors',
};

// Game state
let items = [];

// Initialize items with random positions
function initGame() {
  items = [];
  // Add 25 rocks, 25 papers, 25 scissors
  for (let i = 0; i < ITEM_COUNT; i++) {
    items.push(createItem(TYPES.SCISSORS));
    items.push(createItem(TYPES.ROCK));
    items.push(createItem(TYPES.PAPER));
  }
}

// Create an item of a specific type at a random position
function createItem(type) {
  return {
    id: Math.random().toString(36).substr(2, 9),
    type,
    x: Math.random() * RECT_WIDTH,
    y: Math.random() * RECT_HEIGHT,
    dx: (Math.random() - 0.5) * SPEED,
    dy: (Math.random() - 0.5) * SPEED,
  };
}

// Check collision and change the type based on game rules
function handleCollision(item1, item2) {
  const distance = Math.hypot(item1.x - item2.x, item1.y - item2.y);
  if (distance < ITEM_SIZE) {
    if (
      (item1.type === TYPES.ROCK && item2.type === TYPES.SCISSORS) ||
      (item1.type === TYPES.PAPER && item2.type === TYPES.ROCK) ||
      (item1.type === TYPES.SCISSORS && item2.type === TYPES.PAPER)
    ) {
      item2.type = item1.type; // item1 wins
    } else if (
      (item2.type === TYPES.ROCK && item1.type === TYPES.SCISSORS) ||
      (item2.type === TYPES.PAPER && item1.type === TYPES.ROCK) ||
      (item2.type === TYPES.SCISSORS && item1.type === TYPES.PAPER)
    ) {
      item1.type = item2.type; // item2 wins
    }
  }
}

// Update game state
function updateGame() {
  // Move items
  items.forEach((item) => {
    item.x += item.dx;
    item.y += item.dy;

    // Handle boundary collision (bounce back)
    if (item.x < 0 || item.x > RECT_WIDTH) item.dx = -item.dx;
    if (item.y < 0 || item.y > RECT_HEIGHT) item.dy = -item.dy;
  });

  // Check for collisions and handle
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      handleCollision(items[i], items[j]);
    }
  }

  // Emit the updated game state to clients
  io.emit('gameState', items);
}

// Set up socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');

  // Send initial game state to the client
  socket.emit('gameState', items);

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start the game loop
initGame();
setInterval(updateGame, 1000 / 60); // 60 updates per second

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
