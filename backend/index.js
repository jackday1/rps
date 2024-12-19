const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Create the app and server
const app = express();

app.get('/', (req, res) => res.send('ok - v1.0.0.0'));

const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

const width = 800;
const height = 800;
const itemCount = 25;
const itemTypes = ['rock', 'paper', 'scissors'];
const speed = 1.5;
const timer = 300 * 1000;
const size = 20;

const main = () => {
  // Helper function to generate random velocity
  const getRandomVelocity = () => {
    return {
      x: (Math.random() * 2 - 1) * speed,
      y: (Math.random() * 2 - 1) * speed,
    };
  };

  const randomInRange = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  // Helper function to get initial positions by clusters
  const getInitialPosition = (type) => {
    if (type === 'rock') {
      return {
        x: 250,
        y: 150,
      };
      return {
        x: randomInRange(0, width / 3),
        y: randomInRange(0, height / 3),
      };
    } else if (type === 'paper') {
      return {
        x: 700,
        y: 450,
      };
      return {
        x: randomInRange((2 / 3) * width, width),
        y: randomInRange(height / 3, (2 / 3) * height),
      };
    } else {
      return {
        x: 150,
        y: 650,
      };
      return {
        x: randomInRange(width / 3, (2 / 3) * width),
        y: randomInRange((2 / 3) * height, height),
      };
    }
  };

  // Initialize game state
  let startTime = Date.now();
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

  const gameLoop = setInterval(() => {
    const now = Date.now();
    const timeLeft = timer + startTime - now;

    // Update positions and handle edge of canvas collisions
    gameState.forEach((item) => {
      item.x += item.vx;
      item.y += item.vy;

      // Bounce off walls
      if (item.x - size / 2 <= 0 || item.x + size / 2 >= width) item.vx *= -1;
      if (item.y - size / 2 <= 0 || item.y + size / 2 >= height) item.vy *= -1;

      // Simulate simple "touch" collision detection
      gameState.forEach((otherItem) => {
        if (
          item !== otherItem &&
          Math.abs(item.x - otherItem.x) < size &&
          Math.abs(item.y - otherItem.y) < size
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
    io.emit('gameState', { gameState, timeLeft });

    const counts = {
      rock: 0,
      paper: 0,
      scissors: 0,
    };
    gameState.map((item) => counts[item.type]++);

    if (
      counts.rock === itemCount * 3 ||
      counts.paper === itemCount * 3 ||
      counts.scissors === itemCount * 3
    ) {
      io.emit('gameOver', {
        winner:
          counts.rock > 0 ? 'rock' : counts.paper > 0 ? 'paper' : 'scissors',
      });
      clearInterval(gameLoop);

      setTimeout(main, 5000);
    }

    if (timeLeft <= 0) {
      let max = counts.rock;
      let winner = 'rock';
      if (counts.paper > max) {
        max = counts.paper;
        winner = 'paper';
      }

      if (counts.scissors > max) {
        max = counts.scissors;
        winner = 'scissors';
      }
      io.emit('gameOver', {
        winner,
      });
      clearInterval(gameLoop);

      setTimeout(main, 5000);
    }
  }, 1000 / 30);
};

main();

// Start server
server.listen(process.env.PORT || 8888, () => {
  console.log(`Server is running on port ${process.env.PORT || 8888}`);
});
