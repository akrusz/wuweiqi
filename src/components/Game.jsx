import { useState, useEffect, useCallback } from 'react';
import Board from './Board';
import YinYangPiece, { PlacementPreview } from './YinYangPiece';
import { BOARD_SIZE, selectRules, isMoveLegal, getHint } from '../rules';

const INITIAL_STONES = 15;

const createEmptyBoard = () =>
  Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));

const Game = ({ mode = 'solo', onExit }) => {
  // Game state
  const [board, setBoard] = useState(createEmptyBoard());
  const [rules, setRules] = useState([]);
  const [orientation, setOrientation] = useState(0); // Current piece orientation
  const [lastMove, setLastMove] = useState(null);

  // Pending placement for mobile UI
  const [pendingPlacement, setPendingPlacement] = useState(null); // { row, col, orientation }

  // Player state
  const [currentPlayer, setCurrentPlayer] = useState(1); // 1 or 2
  const [player1Stones, setPlayer1Stones] = useState(INITIAL_STONES);
  const [player2Stones, setPlayer2Stones] = useState(INITIAL_STONES);
  const [player1Moves, setPlayer1Moves] = useState(0);
  const [player2Moves, setPlayer2Moves] = useState(0);

  // Game progress
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [currentHint, setCurrentHint] = useState(null);

  // Move history for feedback
  const [moveHistory, setMoveHistory] = useState([]);

  // Initialize game
  useEffect(() => {
    const selectedRules = selectRules(0.25, 0.5);
    setRules(selectedRules);
    console.log('Hidden rules:', selectedRules.map(r => r.name)); // Debug only
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'r' || e.key === 'R') {
        if (pendingPlacement) {
          rotatePending(1);
        } else {
          rotateOrientation();
        }
      }
      if (e.key === 'Escape') {
        if (pendingPlacement) {
          cancelPlacement();
        } else {
          onExit?.();
        }
      }
      if (e.key === 'Enter' && pendingPlacement) {
        confirmPlacement();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [orientation, onExit, pendingPlacement]);

  const rotateOrientation = useCallback(() => {
    setOrientation((prev) => (prev + 1) % 4);
  }, []);

  const rotatePending = useCallback((direction) => {
    if (pendingPlacement) {
      setPendingPlacement(prev => ({
        ...prev,
        orientation: (prev.orientation + direction + 4) % 4
      }));
    }
  }, [pendingPlacement]);

  const cancelPlacement = useCallback(() => {
    setPendingPlacement(null);
  }, []);

  const getCurrentStones = () =>
    currentPlayer === 1 ? player1Stones : player2Stones;

  const handleCellClick = (row, col) => {
    if (gameOver || board[row][col] || pendingPlacement) return;

    const stones = getCurrentStones();
    if (stones <= 0) return;

    // Set pending placement instead of immediately checking
    setPendingPlacement({ row, col, orientation });
  };

  const confirmPlacement = () => {
    if (!pendingPlacement) return;

    const { row, col, orientation: placementOrientation } = pendingPlacement;
    const legal = isMoveLegal(row, col, placementOrientation, rules, board);

    // Record move
    const move = {
      row,
      col,
      orientation: placementOrientation,
      player: currentPlayer,
      legal,
      timestamp: Date.now(),
    };
    setMoveHistory((prev) => [...prev, move]);

    if (legal) {
      // Place the piece
      const newBoard = board.map((r, ri) =>
        r.map((c, ci) =>
          ri === row && ci === col ? { orientation: placementOrientation } : c
        )
      );
      setBoard(newBoard);

      // Update player stones
      if (currentPlayer === 1) {
        const newStones = player1Stones - 1;
        setPlayer1Stones(newStones);
        setPlayer1Moves((m) => m + 1);

        // Check win condition
        if (newStones === 0) {
          setGameOver(true);
          setWinner(1);
        }
      } else {
        const newStones = player2Stones - 1;
        setPlayer2Stones(newStones);
        setPlayer2Moves((m) => m + 1);

        if (newStones === 0) {
          setGameOver(true);
          setWinner(2);
        }
      }

      // Switch player in duel mode
      if (mode === 'duel' && !gameOver) {
        setCurrentPlayer((p) => (p === 1 ? 2 : 1));
      }
    } else {
      // Invalid move - just count it
      if (currentPlayer === 1) {
        setPlayer1Moves((m) => m + 1);
      } else {
        setPlayer2Moves((m) => m + 1);
      }

      // In duel mode, still switch after invalid move
      if (mode === 'duel') {
        setCurrentPlayer((p) => (p === 1 ? 2 : 1));
      }
    }

    // Show feedback
    setLastMove({ row, col, result: legal ? 'valid' : 'invalid' });

    // Clear pending and feedback after animation
    setPendingPlacement(null);
    setTimeout(() => {
      setLastMove(null);
    }, 1000);
  };

  const requestHint = () => {
    const newLevel = Math.min(hintLevel + 1, 3);
    setHintLevel(newLevel);
    setCurrentHint(getHint(rules, newLevel));
  };

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setRules(selectRules(0.25, 0.5));
    setOrientation(0);
    setLastMove(null);
    setPendingPlacement(null);
    setCurrentPlayer(1);
    setPlayer1Stones(INITIAL_STONES);
    setPlayer2Stones(INITIAL_STONES);
    setPlayer1Moves(0);
    setPlayer2Moves(0);
    setGameOver(false);
    setWinner(null);
    setShowRules(false);
    setHintLevel(0);
    setCurrentHint(null);
    setMoveHistory([]);
  };

  const getOrientationName = (o) => ['North', 'East', 'South', 'West'][o];

  return (
    <div className="game">
      <header className="game-header">
        <h1>无为棋</h1>
        <p className="subtitle">The rules that can be named are not the true rules</p>
      </header>

      <div className="game-main">
        <aside className="game-sidebar left">
          <div className={`player-info ${currentPlayer === 1 ? 'active' : ''}`}>
            <h3>{mode === 'solo' ? 'You' : 'Player 1'}</h3>
            <div className="stones-count">
              <span className="count">{player1Stones}</span>
              <span className="label">stones</span>
            </div>
            <div className="moves-count">
              <span className="count">{player1Moves}</span>
              <span className="label">moves</span>
            </div>
          </div>

          {mode === 'duel' && (
            <div className={`player-info ${currentPlayer === 2 ? 'active' : ''}`}>
              <h3>Player 2</h3>
              <div className="stones-count">
                <span className="count">{player2Stones}</span>
                <span className="label">stones</span>
              </div>
              <div className="moves-count">
                <span className="count">{player2Moves}</span>
                <span className="label">moves</span>
              </div>
            </div>
          )}

          <PlacementPreview
            orientation={pendingPlacement ? pendingPlacement.orientation : orientation}
            onRotate={rotateOrientation}
            stonesRemaining={getCurrentStones()}
          />
        </aside>

        <div className="game-board-area">
          <Board
            board={board}
            onCellClick={handleCellClick}
            previewOrientation={orientation}
            lastMove={lastMove}
            disabled={gameOver || !!pendingPlacement}
            pendingPlacement={pendingPlacement}
          />

          {/* Placement confirmation UI */}
          {pendingPlacement && (
            <div className="placement-confirm-ui">
              <button
                className="rotate-btn rotate-left"
                onClick={() => rotatePending(-1)}
                aria-label="Rotate counter-clockwise"
              >
                ↺
              </button>
              <div className="pending-piece-display">
                <YinYangPiece
                  orientation={pendingPlacement.orientation}
                  size={50}
                />
                <span className="orientation-label">
                  {getOrientationName(pendingPlacement.orientation)}
                </span>
              </div>
              <button
                className="rotate-btn rotate-right"
                onClick={() => rotatePending(1)}
                aria-label="Rotate clockwise"
              >
                ↻
              </button>
              <button
                className="confirm-btn"
                onClick={confirmPlacement}
                aria-label="Confirm placement"
              >
                ✓
              </button>
              <button
                className="cancel-btn"
                onClick={cancelPlacement}
                aria-label="Cancel placement"
              >
                ✕
              </button>
            </div>
          )}

          {/* Current orientation indicator (hidden when placing) */}
          {!pendingPlacement && (
            <div className="orientation-indicator">
              Pointing: <strong>{getOrientationName(orientation)}</strong>
            </div>
          )}
        </div>

        <aside className="game-sidebar right">
          <div className="game-controls">
            <button onClick={requestHint} disabled={hintLevel >= 3}>
              Request Hint ({3 - hintLevel} left)
            </button>
            <button onClick={resetGame}>New Game</button>
            <button onClick={onExit}>Exit</button>
          </div>

          {currentHint && (
            <div className="hint-box">
              <h4>Hint</h4>
              <p>{currentHint}</p>
            </div>
          )}

          {/* Recent moves feed */}
          <div className="move-feed">
            <h4>Recent Moves</h4>
            <ul>
              {moveHistory.slice(-5).reverse().map((move, i) => (
                <li key={i} className={move.legal ? 'valid' : 'invalid'}>
                  {mode === 'duel' && `P${move.player}: `}
                  {String.fromCharCode(65 + move.col)}{BOARD_SIZE - move.row}
                  {' → '}
                  {move.legal ? '○' : '✕'}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* Game over modal */}
      {gameOver && (
        <div className="modal-overlay">
          <div className="modal game-over-modal">
            <h2>
              {mode === 'solo'
                ? 'Congratulations!'
                : `Player ${winner} Wins!`}
            </h2>

            <div className="final-stats">
              {mode === 'solo' ? (
                <p>
                  You placed all stones in <strong>{player1Moves}</strong> moves.
                </p>
              ) : (
                <>
                  <p>Player 1: {INITIAL_STONES - player1Stones} stones in {player1Moves} moves</p>
                  <p>Player 2: {INITIAL_STONES - player2Stones} stones in {player2Moves} moves</p>
                </>
              )}
            </div>

            <button onClick={() => setShowRules(true)}>
              Reveal the Hidden Rules
            </button>

            {showRules && (
              <div className="revealed-rules">
                <h3>The Rules Were:</h3>
                <ul>
                  {rules.map((rule) => (
                    <li key={rule.id}>
                      <strong>{rule.name}</strong>
                      <p>{rule.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="modal-actions">
              <button onClick={resetGame}>Play Again</button>
              <button onClick={onExit}>Exit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
