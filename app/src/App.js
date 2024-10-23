import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:8888');

const App = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState([]);

  const rockImg = useRef(null);
  const paperImg = useRef(null);
  const scissorsImg = useRef(null);

  const rockSound = useRef(null);
  const paperSound = useRef(null);
  const scissorsSound = useRef(null);

  const prevGameState = useRef([]);

  useEffect(() => {
    // Listen for game state updates from the server
    socket.on('gameState', (state) => {
      setGameState(state);
    });

    return () => {
      socket.off('gameState');
    };
  }, []);

  // Draw game items on the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each item
    gameState.forEach((item, index) => {
      let img;
      if (item.type === 'rock') {
        img = rockImg.current;
      } else if (item.type === 'paper') {
        img = paperImg.current;
      } else if (item.type === 'scissors') {
        img = scissorsImg.current;
      }

      if (img) {
        ctx.drawImage(img, item.x - 10, item.y - 10, 20, 20); // Draw image centered
      }

      const prevItem = prevGameState.current[index];
      if (prevItem && prevItem.type !== item.type) {
        if (item.type === 'rock') {
          rockSound.current.play();
        } else if (item.type === 'paper') {
          paperSound.current.play();
        } else if (item.type === 'scissors') {
          scissorsSound.current.play();
        }
      }
    });

    prevGameState.current = gameState;
  }, [gameState]);

  return (
    <div>
      <h1>Rock, Paper, Scissors Battle</h1>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ border: '1px solid black' }}
      />

      <img
        ref={rockImg}
        src="rock.png"
        alt="rock"
        style={{ display: 'none' }}
      />
      <img
        ref={paperImg}
        src="paper.png"
        alt="paper"
        style={{ display: 'none' }}
      />
      <img
        ref={scissorsImg}
        src="scissors.png"
        alt="scissors"
        style={{ display: 'none' }}
      />

      <audio ref={rockSound} src="rock.mp3" preload="auto"></audio>
      <audio ref={paperSound} src="paper.mp3" preload="auto"></audio>
      <audio ref={scissorsSound} src="scissors.mp3" preload="auto"></audio>
    </div>
  );
};

export default App;
