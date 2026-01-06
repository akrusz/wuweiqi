import { useRef, useCallback } from 'react';
import YinYangPiece from './YinYangPiece';
import { BOARD_SIZE } from '../rules';

const DRAG_THRESHOLD = 40; // pixels per rotation step

// Calculate which direction to blow off based on position (radially out from center)
const getBlowOffDirection = (row, col) => {
  const center = (BOARD_SIZE - 1) / 2;
  const dist = 60; // pixels to travel

  // Calculate vector from center to this cell
  const dx = col - center;
  const dy = row - center;

  // If at center, default to down
  if (dx === 0 && dy === 0) {
    return { x: 0, y: dist };
  }

  // Normalize and scale to get radial direction
  const magnitude = Math.sqrt(dx * dx + dy * dy);
  return {
    x: (dx / magnitude) * dist,
    y: (dy / magnitude) * dist
  };
};

const Board = ({
  board, // 2D array of placed pieces: null or { orientation: number }
  onCellClick,
  onConfirmPlacement, // callback to confirm pending placement
  previewOrientation,
  lastMove, // { row, col, result: 'valid'|'invalid' }
  disabled = false,
  pendingPlacement = null, // { row, col, rotationCount }
  failedMoves = null, // 2D array: null or { orientation } for most recent failed move
  showFailedMoves = false,
  onRotatePending = null, // callback to rotate pending piece
}) => {
  const dragState = useRef({
    isDragging: false,
    startX: 0,
    accumulatedDelta: 0,
  });

  const handleDragStart = useCallback((clientX) => {
    if (!pendingPlacement) return;
    dragState.current = {
      isDragging: true,
      startX: clientX,
      accumulatedDelta: 0,
    };
  }, [pendingPlacement]);

  const handleDragMove = useCallback((clientX) => {
    if (!dragState.current.isDragging || !onRotatePending) return;

    const delta = clientX - dragState.current.startX;
    const totalDelta = dragState.current.accumulatedDelta + delta;
    const rotations = Math.floor(totalDelta / DRAG_THRESHOLD);

    if (rotations !== 0) {
      onRotatePending(rotations);
      dragState.current.startX = clientX;
      dragState.current.accumulatedDelta = totalDelta - (rotations * DRAG_THRESHOLD);
    }
  }, [onRotatePending]);

  const handleDragEnd = useCallback(() => {
    dragState.current.isDragging = false;
  }, []);

  // Mouse events
  const handleMouseDown = useCallback((e) => {
    if (e.button === 0) { // Left click only
      handleDragStart(e.clientX);
    }
  }, [handleDragStart]);

  const handleMouseMove = useCallback((e) => {
    handleDragMove(e.clientX);
  }, [handleDragMove]);

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const handleMouseLeave = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Touch events
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      handleDragStart(e.touches[0].clientX);
    }
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 1) {
      handleDragMove(e.touches[0].clientX);
    }
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);
  const renderCell = (row, col) => {
    const piece = board[row][col];
    const isLastMove = lastMove && lastMove.row === row && lastMove.col === col;
    const result = isLastMove ? lastMove.result : null;
    const isPending = pendingPlacement && pendingPlacement.row === row && pendingPlacement.col === col;
    const failedMove = showFailedMoves && failedMoves && failedMoves[row][col];
    const isFailedAnimation = isLastMove && result === 'invalid';
    const blowOffDir = isFailedAnimation ? getBlowOffDirection(row, col) : null;

    const handleCellClick = () => {
      if (disabled) return;
      if (isPending && onConfirmPlacement) {
        // Click on pending piece confirms placement
        onConfirmPlacement();
      } else if (!piece) {
        onCellClick(row, col);
      }
    };

    return (
      <div
        key={`${row}-${col}`}
        className={`board-cell ${piece ? 'occupied' : 'empty'} ${disabled ? 'disabled' : ''} ${isPending ? 'pending' : ''}`}
        onClick={handleCellClick}
      >
        {/* Grid intersection point */}
        <div className="intersection">
          {/* Horizontal line */}
          <div className={`line horizontal ${col === 0 ? 'left-edge' : ''} ${col === BOARD_SIZE - 1 ? 'right-edge' : ''}`} />
          {/* Vertical line */}
          <div className={`line vertical ${row === 0 ? 'top-edge' : ''} ${row === BOARD_SIZE - 1 ? 'bottom-edge' : ''}`} />
          {/* Star point marker */}
          {isStarPoint(row, col) && <div className="star-point" />}
        </div>

        {/* Placed piece */}
        {piece && (
          <YinYangPiece
            orientation={piece.orientation}
            size={36}
            placed={true}
            result={result}
          />
        )}

        {/* Failed move blow-off animation */}
        {isFailedAnimation && !piece && (
          <YinYangPiece
            orientation={lastMove.orientation}
            size={36}
            result="invalid"
            blowOffDirection={blowOffDir}
          />
        )}

        {/* Pending placement piece with rotation hints */}
        {isPending && (
          <div className="pending-piece-wrapper">
            <span className="rotate-hint-arrow left">↺</span>
            <YinYangPiece
              rotationDegrees={pendingPlacement.rotationCount * 90}
              size={36}
              className="pending-piece"
            />
            <span className="rotate-hint-arrow right">↻</span>
          </div>
        )}

        {/* Hover preview for empty cells (hidden when placing a piece) */}
        {!piece && !disabled && !pendingPlacement && (
          <div className="hover-preview">
            <YinYangPiece
              rotationDegrees={previewOrientation * 90}
              size={36}
              className="preview"
            />
          </div>
        )}

        {/* Failed move indicator */}
        {!piece && failedMove && !isPending && (
          <div className="failed-move-indicator">
            <YinYangPiece
              orientation={failedMove.orientation}
              size={36}
              className="failed"
            />
          </div>
        )}

        {/* Coordinate labels */}
        {col === 0 && (
          <span className="coord-label row-label">{BOARD_SIZE - row}</span>
        )}
        {row === BOARD_SIZE - 1 && (
          <span className="coord-label col-label">{String.fromCharCode(65 + col)}</span>
        )}
      </div>
    );
  };

  return (
    <div
      className="board-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="board">
        {Array(BOARD_SIZE).fill(null).map((_, row) => (
          <div key={row} className="board-row">
            {Array(BOARD_SIZE).fill(null).map((_, col) => renderCell(row, col))}
          </div>
        ))}
      </div>
      {pendingPlacement && (
        <div className="drag-hint">
          <span className="drag-arrow">←</span>
          Drag piece to rotate
          <span className="drag-arrow">→</span>
        </div>
      )}
    </div>
  );
};

// Traditional Go star points for 9x9 board
const isStarPoint = (row, col) => {
  const starPoints = [
    [2, 2], [2, 6],
    [4, 4], // tengen (center)
    [6, 2], [6, 6],
  ];
  return starPoints.some(([r, c]) => r === row && c === col);
};

export default Board;
