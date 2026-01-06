import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import Board from './Board';
import YinYangPiece, { PlacementPreview } from './YinYangPiece';
import { BOARD_SIZE, selectRules, isMoveLegal } from '../rules';

const SOLO_STONES = 13;
const DUEL_STONES = 9;

const createEmptyBoard = () =>
  Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));

const Game = ({ mode = 'solo', onExit }) => {
  const initialStones = mode === 'solo' ? SOLO_STONES : DUEL_STONES;

  // Game state
  const [board, setBoard] = useState(createEmptyBoard());
  const [rules, setRules] = useState([]);
  const [rotationCount, setRotationCount] = useState(0); // Cumulative rotation count for smooth animation
  const [lastMove, setLastMove] = useState(null);

  // Pending placement for mobile UI
  const [pendingPlacement, setPendingPlacement] = useState(null); // { row, col, rotationCount }

  // Computed orientation (0-3) from rotation count
  const orientation = ((rotationCount % 4) + 4) % 4;

  // Player state
  const [currentPlayer, setCurrentPlayer] = useState(1); // 1 or 2
  const [player1Stones, setPlayer1Stones] = useState(initialStones);
  const [player2Stones, setPlayer2Stones] = useState(initialStones);
  const [player1Moves, setPlayer1Moves] = useState(0);
  const [player2Moves, setPlayer2Moves] = useState(0);

  // Game progress
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [showRules, setShowRules] = useState(false);

  // Failed moves tracking (most recent failed move per cell)
  const [failedMoves, setFailedMoves] = useState(createEmptyBoard()); // 2D array: null or { orientation }
  const [showFailedMoves, setShowFailedMoves] = useState(false);

  // Move history for feedback
  const [moveHistory, setMoveHistory] = useState([]);

  // Refs for connecting line
  const boardAreaRef = useRef(null);
  const placementUIRef = useRef(null);
  const [lineCoords, setLineCoords] = useState(null);

  // Calculate connecting line after layout
  useLayoutEffect(() => {
    if (!pendingPlacement || !boardAreaRef.current || !placementUIRef.current) {
      setLineCoords(null);
      return;
    }

    const boardArea = boardAreaRef.current;
    const placementUI = placementUIRef.current;
    const pendingCell = boardArea.querySelector('.board-cell.pending');

    if (!pendingCell) {
      setLineCoords(null);
      return;
    }

    const boardRect = boardArea.getBoundingClientRect();
    const cellRect = pendingCell.getBoundingClientRect();
    const uiRect = placementUI.getBoundingClientRect();

    setLineCoords({
      x1: cellRect.left + cellRect.width / 2 - boardRect.left,
      y1: cellRect.top + cellRect.height / 2 - boardRect.top,
      x2: uiRect.left + uiRect.width / 2 - boardRect.left,
      y2: uiRect.top - boardRect.top,
    });
  }, [pendingPlacement]);

  // Initialize game
  useEffect(() => {
    const selectedRules = selectRules(0.25, 0.5);
    setRules(selectedRules);
    console.log('Hidden rules:', selectedRules.map(r => r.name)); // Debug only
  }, []);

  const rotateOrientation = useCallback((direction = 1) => {
    setRotationCount((prev) => prev + direction);
  }, []);

  const rotatePending = useCallback((direction) => {
    setPendingPlacement(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        rotationCount: prev.rotationCount + direction
      };
    });
  }, []);

  const cancelPlacement = useCallback(() => {
    setPendingPlacement(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPlacement, onExit, rotatePending, rotateOrientation, cancelPlacement]);

  const getCurrentStones = () =>
    currentPlayer === 1 ? player1Stones : player2Stones;

  const handleCellClick = (row, col) => {
    if (gameOver || board[row][col]) return;

    const stones = getCurrentStones();
    if (stones <= 0) return;

    // If there's already a pending placement, move it to the new cell (keep current rotation)
    if (pendingPlacement) {
      setPendingPlacement(prev => ({ ...prev, row, col }));
    } else {
      // Set new pending placement
      setPendingPlacement({ row, col, rotationCount });
    }
  };

  const confirmPlacement = () => {
    if (!pendingPlacement) return;

    const { row, col, rotationCount: placementRotation } = pendingPlacement;
    const placementOrientation = ((placementRotation % 4) + 4) % 4;
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
      // Invalid move - record it and count it
      setFailedMoves(prev => prev.map((r, ri) =>
        r.map((c, ci) =>
          ri === row && ci === col ? { orientation: placementOrientation } : c
        )
      ));

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
    setLastMove({ row, col, orientation: placementOrientation, result: legal ? 'valid' : 'invalid' });

    // Clear pending and feedback after animation
    setPendingPlacement(null);
    setTimeout(() => {
      setLastMove(null);
    }, 1000);
  };

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setRules(selectRules(0.25, 0.5));
    setRotationCount(0);
    setLastMove(null);
    setPendingPlacement(null);
    setCurrentPlayer(1);
    setPlayer1Stones(initialStones);
    setPlayer2Stones(initialStones);
    setPlayer1Moves(0);
    setPlayer2Moves(0);
    setGameOver(false);
    setWinner(null);
    setShowRules(false);
    setFailedMoves(createEmptyBoard());
    setShowFailedMoves(false);
    setMoveHistory([]);
  };

  const getOrientationName = (o) => ['North', 'East', 'South', 'West'][o];

  return (
    <div className="game" onClick={() => pendingPlacement && cancelPlacement()}>
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
            stonesRemaining={getCurrentStones()}
          />
        </aside>

        <div className="game-board-area" ref={boardAreaRef} onClick={(e) => e.stopPropagation()}>
          <Board
            board={board}
            onCellClick={handleCellClick}
            onConfirmPlacement={confirmPlacement}
            previewOrientation={orientation}
            lastMove={lastMove}
            disabled={gameOver}
            pendingPlacement={pendingPlacement}
            failedMoves={failedMoves}
            showFailedMoves={showFailedMoves}
            onRotatePending={rotatePending}
          />


          {/* Connecting line */}
          {lineCoords && (
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                overflow: 'visible',
              }}
            >
              <line
                x1={lineCoords.x1}
                y1={lineCoords.y1}
                x2={lineCoords.x2}
                y2={lineCoords.y2}
                stroke="rgba(255, 230, 0, 0.6)"
                strokeWidth="3"
                strokeDasharray="6 4"
              />
            </svg>
          )}

          {/* Placement confirmation UI */}
          {pendingPlacement && (
            <div className="placement-confirm-ui" ref={placementUIRef}>
              <button
                className="rotate-btn rotate-left"
                onClick={() => rotatePending(-1)}
                aria-label="Rotate counter-clockwise"
              >
                ↺
              </button>
              <div className="pending-piece-display">
                <YinYangPiece
                  rotationDegrees={pendingPlacement.rotationCount * 90}
                  size={50}
                />
                <span className="orientation-label">
                  {getOrientationName(((pendingPlacement.rotationCount % 4) + 4) % 4)}
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

        </div>

        <aside className="game-sidebar right">
          <div className="game-controls">
            <button
              onClick={() => setShowFailedMoves(prev => !prev)}
              className={showFailedMoves ? 'active' : ''}
            >
              {showFailedMoves ? 'Hide' : 'Show'} Failed Moves
            </button>
            <button onClick={resetGame}>New Game</button>
            <button onClick={onExit}>Exit</button>
          </div>

          {/* Recent moves feed */}
          <div className="move-feed">
            <h4>Recent Moves</h4>
            <ul>
              {moveHistory.slice(-5).reverse().map((move, i) => (
                <li key={i} className={move.legal ? 'valid' : 'invalid'}>
                  {mode === 'duel' && `P${move.player}: `}
                  {String.fromCharCode(65 + move.col)}{BOARD_SIZE - move.row}
                  <span className="move-orientation">{getOrientationName(move.orientation)[0]}</span>
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
                  <p>Player 1: {initialStones - player1Stones} stones in {player1Moves} moves</p>
                  <p>Player 2: {initialStones - player2Stones} stones in {player2Moves} moves</p>
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
