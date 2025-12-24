import { useState } from 'react';
import Game from './components/Game';
import './App.css';

function App() {
  const [screen, setScreen] = useState('menu'); // 'menu', 'solo', 'duel', 'about'

  const renderMenu = () => (
    <div className="menu">
      <div className="menu-header">
        <div className="logo">
          <svg viewBox="0 0 100 100" width="120" height="120" className="logo-svg">
            <circle cx="50" cy="50" r="48" fill="#1a1a1a" stroke="#444" strokeWidth="2" />
            <path
              d="M 50 2 A 48 48 0 0 1 50 98 A 24 24 0 0 1 50 50 A 24 24 0 0 0 50 2"
              fill="#f5f5f0"
            />
            <path
              d="M 50 2 A 48 48 0 0 0 50 98 A 24 24 0 0 0 50 50 A 24 24 0 0 1 50 2"
              fill="#1a1a1a"
            />
            <circle cx="50" cy="26" r="8" fill="#f5f5f0" />
          </svg>
        </div>
        <h1>无为棋</h1>
        <h2>Wuweiqi</h2>
        <p className="tagline">The rules that can be named are not the true rules</p>
      </div>

      <div className="menu-buttons">
        <button onClick={() => setScreen('solo')} className="menu-button primary">
          <span className="button-icon">☯</span>
          <span className="button-text">
            <strong>Solo Puzzle</strong>
            <small>Discover the hidden rules alone</small>
          </span>
        </button>

        <button onClick={() => setScreen('duel')} className="menu-button">
          <span className="button-icon">⚔</span>
          <span className="button-text">
            <strong>Duel Mode</strong>
            <small>Race against a friend</small>
          </span>
        </button>

        <button onClick={() => setScreen('about')} className="menu-button subtle">
          <span className="button-icon">?</span>
          <span className="button-text">
            <strong>How to Play</strong>
          </span>
        </button>
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="about">
      <h1>How to Play</h1>

      <section>
        <h2>The Way</h2>
        <p>
          In Wuweiqi, the rules are hidden. Each game generates a unique set of rules
          that determine which moves are legal. Your goal is to discover these rules
          through experimentation and place all your stones.
        </p>
      </section>

      <section>
        <h2>Mechanics</h2>
        <ul>
          <li><strong>Click</strong> on any intersection to place a stone</li>
          <li><strong>Right-click</strong> or press <strong>R</strong> to rotate your piece</li>
          <li>Valid moves show <span className="valid">○</span> and remain on the board</li>
          <li>Invalid moves show <span className="invalid">✕</span> and are removed</li>
        </ul>
      </section>

      <section>
        <h2>Solo Mode</h2>
        <p>
          Place all 15 stones on the board. Try to minimize your total moves
          by learning the hidden rules quickly.
        </p>
      </section>

      <section>
        <h2>Duel Mode</h2>
        <p>
          Two players take turns. Both share the same hidden rules.
          The first player to place all their stones wins!
        </p>
      </section>

      <section>
        <h2>The Rules</h2>
        <p>
          Rules can involve position (rows, columns, edges), orientation
          (which way the yin-yang points), relationships to other stones,
          or mathematical patterns. Multiple rules may be active at once.
        </p>
      </section>

      <section>
        <h2>Philosophy</h2>
        <blockquote>
          "The Tao that can be told is not the eternal Tao."
          <cite>— Tao Te Ching</cite>
        </blockquote>
        <p>
          This game is about presence, observation, and flowing with what is.
          Don't fight the rules — discover them.
        </p>
      </section>

      <button onClick={() => setScreen('menu')} className="back-button">
        Return to Menu
      </button>
    </div>
  );

  return (
    <div className="app">
      {screen === 'menu' && renderMenu()}
      {screen === 'about' && renderAbout()}
      {screen === 'solo' && (
        <Game mode="solo" onExit={() => setScreen('menu')} />
      )}
      {screen === 'duel' && (
        <Game mode="duel" onExit={() => setScreen('menu')} />
      )}
    </div>
  );
}

export default App;
