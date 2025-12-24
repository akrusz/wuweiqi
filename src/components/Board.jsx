import YinYangPiece from './YinYangPiece';
import { BOARD_SIZE } from '../rules';

const Board = ({
  board, // 2D array of placed pieces: null or { orientation: number }
  onCellClick,
  previewOrientation,
  lastMove, // { row, col, result: 'valid'|'invalid' }
  disabled = false,
  pendingPlacement = null, // { row, col, orientation }
}) => {
  const renderCell = (row, col) => {
    const piece = board[row][col];
    const isLastMove = lastMove && lastMove.row === row && lastMove.col === col;
    const result = isLastMove ? lastMove.result : null;
    const isPending = pendingPlacement && pendingPlacement.row === row && pendingPlacement.col === col;

    return (
      <div
        key={`${row}-${col}`}
        className={`board-cell ${piece ? 'occupied' : 'empty'} ${disabled ? 'disabled' : ''} ${isPending ? 'pending' : ''}`}
        onClick={() => !disabled && !piece && onCellClick(row, col)}
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

        {/* Pending placement piece */}
        {isPending && (
          <YinYangPiece
            orientation={pendingPlacement.orientation}
            size={36}
            className="pending-piece"
          />
        )}

        {/* Hover preview for empty cells (only when not in pending mode) */}
        {!piece && !disabled && !pendingPlacement && (
          <div className="hover-preview">
            <YinYangPiece
              orientation={previewOrientation}
              size={36}
              className="preview"
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
    <div className="board-container">
      <div className="board">
        {Array(BOARD_SIZE).fill(null).map((_, row) => (
          <div key={row} className="board-row">
            {Array(BOARD_SIZE).fill(null).map((_, col) => renderCell(row, col))}
          </div>
        ))}
      </div>
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
