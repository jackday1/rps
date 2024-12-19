import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:8888');

const BarGraph = ({ counts }) => {
  const total = counts.rock + counts.paper + counts.scissors;
  const rockPercent = counts.rock / total;
  const paperPercent = counts.paper / total;
  const scissorsPercent = 1 - rockPercent - paperPercent;

  return (
    <div>
      <div
        style={{
          width: '100%',
          height: '20px',
          display: 'flex',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${rockPercent * 100}%`,
            backgroundColor: '#616d77',
            transition: 'all ease 0.2s',
            position: 'relative',
          }}
        >
          {counts.rock && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: 'translateY(-100%)',
                display: 'flex',
                justifyContent: 'center',
                padding: 8,
              }}
            >
              <div
                style={{
                  padding: '2px 4px',
                  borderRadius: 4,
                  boxShadow: '0px 0px 50px 0px rgba(0,0,0,0.75)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img src="rock.png" alt="rock" width={16} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>
                  {counts.rock}
                </span>
              </div>
            </div>
          )}
        </div>
        <div
          style={{
            height: '100%',
            width: `${paperPercent * 100}%`,
            backgroundColor: '#e8ba5c',
            transition: 'all ease 0.2s',
            position: 'relative',
          }}
        >
          {counts.paper && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: 'translateY(-100%)',
                display: 'flex',
                justifyContent: 'center',
                padding: 8,
              }}
            >
              <div
                style={{
                  padding: '2px 4px',
                  borderRadius: 4,
                  boxShadow: '0px 0px 50px 0px rgba(0,0,0,0.75)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img src="paper.png" alt="rock" width={16} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>
                  {counts.paper}
                </span>
              </div>
            </div>
          )}
        </div>
        <div
          style={{
            height: '100%',
            width: `${scissorsPercent * 100}%`,
            backgroundColor: '#fd5d72',
            transition: 'all ease 0.2s',
            position: 'relative',
          }}
        >
          {counts.scissors && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: 'translateY(-100%)',
                display: 'flex',
                justifyContent: 'center',
                padding: 8,
              }}
            >
              <div
                style={{
                  padding: '2px 4px',
                  borderRadius: 4,
                  boxShadow: '0px 0px 50px 0px rgba(0,0,0,0.75)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img src="scissors.png" alt="rock" width={16} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>
                  {counts.scissors}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState([]);
  const [winner, setWinner] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');

  const rockImg = useRef(null);
  const paperImg = useRef(null);
  const scissorsImg = useRef(null);

  const rockSound = useRef(null);
  const paperSound = useRef(null);
  const scissorsSound = useRef(null);

  const prevGameState = useRef([]);

  useEffect(() => {
    // Listen for game state updates from the server
    socket.on('gameState', ({ gameState, timeLeft }) => {
      setGameState(gameState);
      setTimeLeft(Math.floor(Math.max(timeLeft, 0) / 1000));
    });

    socket.on('gameOver', ({ winner }) => {
      setWinner(winner); // Display the winner
    });

    return () => {
      socket.off('gameState');
      socket.off('gameOver');
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

  const counts = gameState.reduce(
    (result, item) => {
      result[item.type]++;
      return result;
    },
    { rock: 0, paper: 0, scissors: 0 }
  );

  return (
    <div
      style={{
        width: '100vw',
        overflow: 'auto',
        background: 'white',
        padding: 16,
      }}
    >
      <p style={{ fontSize: 40, fontWeight: 600, textAlign: 'center' }}>
        {timeLeft}
      </p>
      <BarGraph counts={counts} />
      <canvas
        ref={canvasRef}
        width={800}
        height={800}
        style={{
          width: '100%',
          backgroundColor: '#ddd',
        }}
      />
      {winner && <h3>{winner.toUpperCase()} Wins!</h3>}

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
