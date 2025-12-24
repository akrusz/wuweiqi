// Rule Engine for Wuweiqi
// "The rules that can be named are not the true rules"

// Board is 9x9, positions are 0-8 for both row and col
// Orientation: 0=North, 1=East, 2=South, 3=West (where the white "eye" points)

// Each rule is an object with:
// - id: unique identifier
// - name: human-readable name (revealed at end)
// - description: what makes a move ILLEGAL
// - check: function(row, col, orientation, boardState) => true if ILLEGAL

const BOARD_SIZE = 9;

// Helper functions for rules
const isEdge = (row, col) => row === 0 || row === 8 || col === 0 || col === 8;
const isCorner = (row, col) => (row === 0 || row === 8) && (col === 0 || col === 8);
const getDistance = (r1, c1, r2, c2) => Math.abs(r1 - r2) + Math.abs(c1 - c2);
const getNeighbors = (row, col) => {
  const neighbors = [];
  if (row > 0) neighbors.push([row - 1, col]);
  if (row < 8) neighbors.push([row + 1, col]);
  if (col > 0) neighbors.push([row, col - 1]);
  if (col < 8) neighbors.push([row, col + 1]);
  return neighbors;
};
const getDiagonalNeighbors = (row, col) => {
  const diagonals = [];
  if (row > 0 && col > 0) diagonals.push([row - 1, col - 1]);
  if (row > 0 && col < 8) diagonals.push([row - 1, col + 1]);
  if (row < 8 && col > 0) diagonals.push([row + 1, col - 1]);
  if (row < 8 && col < 8) diagonals.push([row + 1, col + 1]);
  return diagonals;
};

// All possible rules - each returns true if the move is ILLEGAL
export const ALL_RULES = [
  // Position-based rules (row/column)
  {
    id: 'even_row',
    name: 'Even Row Forbidden',
    description: 'Stones in even-numbered rows are illegal',
    check: (row, col, orientation, board) => row % 2 === 0,
    weight: 1,
  },
  {
    id: 'odd_row',
    name: 'Odd Row Forbidden',
    description: 'Stones in odd-numbered rows are illegal',
    check: (row, col, orientation, board) => row % 2 === 1,
    weight: 1,
  },
  {
    id: 'even_col',
    name: 'Even Column Forbidden',
    description: 'Stones in even-numbered columns are illegal',
    check: (row, col, orientation, board) => col % 2 === 0,
    weight: 1,
  },
  {
    id: 'odd_col',
    name: 'Odd Column Forbidden',
    description: 'Stones in odd-numbered columns are illegal',
    check: (row, col, orientation, board) => col % 2 === 1,
    weight: 1,
  },

  // Edge/corner rules
  {
    id: 'edge_forbidden',
    name: 'Edge Forbidden',
    description: 'Stones on the edge are illegal',
    check: (row, col, orientation, board) => isEdge(row, col),
    weight: 1,
  },
  {
    id: 'center_forbidden',
    name: 'Center Forbidden',
    description: 'Stones not on the edge are illegal',
    check: (row, col, orientation, board) => !isEdge(row, col),
    weight: 1,
  },
  {
    id: 'corner_forbidden',
    name: 'Corner Forbidden',
    description: 'Stones in corners are illegal',
    check: (row, col, orientation, board) => isCorner(row, col),
    weight: 0.3, // Less impactful
  },

  // Quadrant rules
  {
    id: 'top_half',
    name: 'Top Half Forbidden',
    description: 'Stones in top half (rows 0-3) are illegal',
    check: (row, col, orientation, board) => row <= 3,
    weight: 1,
  },
  {
    id: 'bottom_half',
    name: 'Bottom Half Forbidden',
    description: 'Stones in bottom half (rows 5-8) are illegal',
    check: (row, col, orientation, board) => row >= 5,
    weight: 1,
  },
  {
    id: 'left_half',
    name: 'Left Half Forbidden',
    description: 'Stones in left half (cols 0-3) are illegal',
    check: (row, col, orientation, board) => col <= 3,
    weight: 1,
  },
  {
    id: 'right_half',
    name: 'Right Half Forbidden',
    description: 'Stones in right half (cols 5-8) are illegal',
    check: (row, col, orientation, board) => col >= 5,
    weight: 1,
  },

  // Diagonal rules
  {
    id: 'main_diagonal',
    name: 'Main Diagonal Forbidden',
    description: 'Stones on the main diagonal (row=col) are illegal',
    check: (row, col, orientation, board) => row === col,
    weight: 0.3,
  },
  {
    id: 'anti_diagonal',
    name: 'Anti-Diagonal Forbidden',
    description: 'Stones on the anti-diagonal (row+col=8) are illegal',
    check: (row, col, orientation, board) => row + col === 8,
    weight: 0.3,
  },

  // Orientation rules (where the white dot points)
  {
    id: 'north_forbidden',
    name: 'North Forbidden',
    description: 'Yin-yang pointing North is illegal',
    check: (row, col, orientation, board) => orientation === 0,
    weight: 0.8,
  },
  {
    id: 'east_forbidden',
    name: 'East Forbidden',
    description: 'Yin-yang pointing East is illegal',
    check: (row, col, orientation, board) => orientation === 1,
    weight: 0.8,
  },
  {
    id: 'south_forbidden',
    name: 'South Forbidden',
    description: 'Yin-yang pointing South is illegal',
    check: (row, col, orientation, board) => orientation === 2,
    weight: 0.8,
  },
  {
    id: 'west_forbidden',
    name: 'West Forbidden',
    description: 'Yin-yang pointing West is illegal',
    check: (row, col, orientation, board) => orientation === 3,
    weight: 0.8,
  },

  // Neighbor rules (based on existing stones)
  {
    id: 'adjacent_forbidden',
    name: 'Adjacent Forbidden',
    description: 'Stones adjacent to other stones are illegal',
    check: (row, col, orientation, board) => {
      const neighbors = getNeighbors(row, col);
      return neighbors.some(([r, c]) => board[r][c] !== null);
    },
    weight: 0.7,
    dynamic: true,
  },
  {
    id: 'isolated_forbidden',
    name: 'Isolation Forbidden',
    description: 'Stones NOT adjacent to other stones are illegal (after first)',
    check: (row, col, orientation, board) => {
      // First stone is always allowed for this rule
      const hasAnyStone = board.some(row => row.some(cell => cell !== null));
      if (!hasAnyStone) return false;

      const neighbors = getNeighbors(row, col);
      return !neighbors.some(([r, c]) => board[r][c] !== null);
    },
    weight: 0.7,
    dynamic: true,
  },
  {
    id: 'diagonal_neighbor_forbidden',
    name: 'Diagonal Neighbor Forbidden',
    description: 'Stones diagonally adjacent to other stones are illegal',
    check: (row, col, orientation, board) => {
      const diagonals = getDiagonalNeighbors(row, col);
      return diagonals.some(([r, c]) => board[r][c] !== null);
    },
    weight: 0.6,
    dynamic: true,
  },

  // Mathematical rules
  {
    id: 'sum_even',
    name: 'Even Sum Forbidden',
    description: 'Positions where row+col is even are illegal',
    check: (row, col, orientation, board) => (row + col) % 2 === 0,
    weight: 1,
  },
  {
    id: 'sum_odd',
    name: 'Odd Sum Forbidden',
    description: 'Positions where row+col is odd are illegal',
    check: (row, col, orientation, board) => (row + col) % 2 === 1,
    weight: 1,
  },
  {
    id: 'product_even',
    name: 'Even Product Forbidden',
    description: 'Positions where row*col is even are illegal',
    check: (row, col, orientation, board) => (row * col) % 2 === 0,
    weight: 1,
  },

  // Special position rules
  {
    id: 'star_points',
    name: 'Star Points Forbidden',
    description: 'Traditional Go star points (3,3), (3,6), etc. are illegal',
    check: (row, col, orientation, board) => {
      const stars = [[2,2], [2,4], [2,6], [4,2], [4,4], [4,6], [6,2], [6,4], [6,6]];
      return stars.some(([r, c]) => r === row && c === col);
    },
    weight: 0.3,
  },
  {
    id: 'center_point',
    name: 'Center Point Forbidden',
    description: 'The center point (4,4) is illegal',
    check: (row, col, orientation, board) => row === 4 && col === 4,
    weight: 0.1,
  },

  // Distance rules
  {
    id: 'near_center',
    name: 'Near Center Forbidden',
    description: 'Stones within 2 steps of center are illegal',
    check: (row, col, orientation, board) => getDistance(row, col, 4, 4) <= 2,
    weight: 0.5,
  },
  {
    id: 'far_from_center',
    name: 'Far From Center Forbidden',
    description: 'Stones more than 3 steps from center are illegal',
    check: (row, col, orientation, board) => getDistance(row, col, 4, 4) > 3,
    weight: 0.6,
  },

  // Row/col specific
  {
    id: 'middle_row',
    name: 'Middle Row Forbidden',
    description: 'Row 4 (the middle) is illegal',
    check: (row, col, orientation, board) => row === 4,
    weight: 0.3,
  },
  {
    id: 'middle_col',
    name: 'Middle Column Forbidden',
    description: 'Column 4 (the middle) is illegal',
    check: (row, col, orientation, board) => col === 4,
    weight: 0.3,
  },

  // Orientation + position combos
  {
    id: 'north_in_north',
    name: 'North in North Forbidden',
    description: 'North-pointing stones in top half are illegal',
    check: (row, col, orientation, board) => orientation === 0 && row <= 3,
    weight: 0.4,
  },
  {
    id: 'east_on_east',
    name: 'East on East Forbidden',
    description: 'East-pointing stones in right half are illegal',
    check: (row, col, orientation, board) => orientation === 1 && col >= 5,
    weight: 0.4,
  },
  {
    id: 'edge_orientation',
    name: 'Edge Orientation Forbidden',
    description: 'Stones on edge must not point outward',
    check: (row, col, orientation, board) => {
      if (row === 0 && orientation === 0) return true; // Top edge, pointing north
      if (row === 8 && orientation === 2) return true; // Bottom edge, pointing south
      if (col === 0 && orientation === 3) return true; // Left edge, pointing west
      if (col === 8 && orientation === 1) return true; // Right edge, pointing east
      return false;
    },
    weight: 0.3,
  },
];

// Get rules that are compatible (don't contradict each other obviously)
const getIncompatiblePairs = () => [
  ['even_row', 'odd_row'],
  ['even_col', 'odd_col'],
  ['edge_forbidden', 'center_forbidden'],
  ['top_half', 'bottom_half'],
  ['left_half', 'right_half'],
  ['adjacent_forbidden', 'isolated_forbidden'],
  ['sum_even', 'sum_odd'],
  ['near_center', 'far_from_center'],
];

// Calculate what percentage of the board would be legal with given rules
const calculateLegalPercentage = (rules) => {
  let legalCount = 0;
  const emptyBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      // Check all 4 orientations
      for (let orientation = 0; orientation < 4; orientation++) {
        const isIllegal = rules.some(rule => rule.check(row, col, orientation, emptyBoard));
        if (!isIllegal) {
          legalCount++;
          break; // At least one orientation works
        }
      }
    }
  }

  return legalCount / (BOARD_SIZE * BOARD_SIZE);
};

// Select random rules that achieve target legality
export const selectRules = (targetMin = 0.25, targetMax = 0.5, maxAttempts = 100) => {
  const incompatible = getIncompatiblePairs();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Randomly select 1-4 rules
    const numRules = Math.floor(Math.random() * 4) + 1;
    const shuffled = [...ALL_RULES].sort(() => Math.random() - 0.5);
    const selected = [];

    for (const rule of shuffled) {
      if (selected.length >= numRules) break;

      // Check compatibility
      const isCompatible = !selected.some(existingRule =>
        incompatible.some(pair =>
          (pair.includes(rule.id) && pair.includes(existingRule.id))
        )
      );

      if (isCompatible) {
        selected.push(rule);
      }
    }

    const legalPct = calculateLegalPercentage(selected);

    if (legalPct >= targetMin && legalPct <= targetMax) {
      return selected;
    }
  }

  // Fallback: return a simple rule set
  return [ALL_RULES.find(r => r.id === 'sum_even')];
};

// Check if a move is legal given the current rules and board state
export const isMoveLegal = (row, col, orientation, rules, board) => {
  return !rules.some(rule => rule.check(row, col, orientation, board));
};

// Get hint about a rule (vague)
export const getHint = (rules, hintLevel = 1) => {
  if (rules.length === 0) return "There are no restrictions.";

  const rule = rules[Math.floor(Math.random() * rules.length)];

  const hints = {
    1: [
      "Consider the geometry of your position...",
      "The orientation may matter...",
      "Numbers hold secrets...",
      "Neighbors can be friends or foes...",
      "The center is not always the answer...",
    ],
    2: [
      rule.id.includes('row') ? "Rows have meaning..." :
      rule.id.includes('col') ? "Columns have meaning..." :
      rule.id.includes('orientation') || rule.id.includes('north') || rule.id.includes('south') || rule.id.includes('east') || rule.id.includes('west') ? "Which way do you face?" :
      rule.id.includes('adjacent') || rule.id.includes('neighbor') ? "Mind your neighbors..." :
      rule.id.includes('edge') ? "Boundaries matter..." :
      "The pattern is there, look deeper...",
    ],
    3: [
      rule.description.replace('illegal', 'significant').replace('are', 'might be'),
    ],
  };

  const levelHints = hints[Math.min(hintLevel, 3)];
  return levelHints[Math.floor(Math.random() * levelHints.length)];
};

export { BOARD_SIZE };
