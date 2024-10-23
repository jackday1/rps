const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Create the app and server
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

const PORT = 8888;

const width = 800;
const height = 600;
const itemCount = 25;
const itemTypes = ['rock', 'paper', 'scissors'];

// Helper function to generate random velocity
function getRandomVelocity() {
  return {
    x: Math.random() * 2 - 1, // random velocity between -1 and 1
    y: Math.random() * 2 - 1, // random velocity between -1 and 1
  };
}

// Helper function to get initial positions by clusters
function getInitialPosition(type) {
  const clusterPadding = 100;
  if (type === 'rock') {
    return {
      x: Math.random() * (width / 3 - clusterPadding) + clusterPadding / 2,
      y: Math.random() * (height - clusterPadding) + clusterPadding / 2,
    };
  } else if (type === 'paper') {
    return {
      x:
        Math.random() * (width / 3 - clusterPadding) +
        width / 3 +
        clusterPadding / 2,
      y: Math.random() * (height - clusterPadding) + clusterPadding / 2,
    };
  } else {
    return {
      x:
        Math.random() * (width / 3 - clusterPadding) +
        (2 * width) / 3 +
        clusterPadding / 2,
      y: Math.random() * (height - clusterPadding) + clusterPadding / 2,
    };
  }
}

// Initialize game state
let gameState = [];
itemTypes.forEach((type) => {
  for (let i = 0; i < itemCount; i++) {
    const position = getInitialPosition(type);
    const velocity = getRandomVelocity();
    gameState.push({
      type,
      x: position.x,
      y: position.y,
      vx: velocity.x,
      vy: velocity.y,
    });
  }
});

setInterval(() => {
  // Update positions and handle edge of canvas collisions
  gameState.forEach((item) => {
    item.x += item.vx;
    item.y += item.vy;

    // Bounce off walls
    if (item.x <= 0 || item.x >= width) item.vx *= -1;
    if (item.y <= 0 || item.y >= height) item.vy *= -1;

    // Simulate simple "touch" collision detection
    gameState.forEach((otherItem) => {
      if (
        item !== otherItem &&
        Math.abs(item.x - otherItem.x) < 20 &&
        Math.abs(item.y - otherItem.y) < 20
      ) {
        // Check winning condition
        if (
          (item.type === 'rock' && otherItem.type === 'scissors') ||
          (item.type === 'scissors' && otherItem.type === 'paper') ||
          (item.type === 'paper' && otherItem.type === 'rock')
        ) {
          otherItem.type = item.type; // Loser turns into the winner's type

          // Change the velocity of both items on collision
          const newVelocity1 = getRandomVelocity();
          const newVelocity2 = getRandomVelocity();

          item.vx = newVelocity1.x;
          item.vy = newVelocity1.y;
          otherItem.vx = newVelocity2.x;
          otherItem.vy = newVelocity2.y;
        }
      }
    });
  });

  // Emit updated game state
  io.emit('gameState', gameState);
}, 1000 / 30);

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
