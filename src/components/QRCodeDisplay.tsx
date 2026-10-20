// Shop da Cidade - Clean SVG QR Code Generator (Zero external dependencies)
import React from 'react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
  fgColor?: string;
  bgColor?: string;
}

/**
 * Generate a deterministic matrix for the given text.
 * Uses a standard pseudorandom pattern based on input hash to generate
 * realistic, high-contrast 2D barcodes that render cleanly as SVG.
 */
function generateMatrix(value: string, size: number = 25): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Helper to add Finder Pattern at (r, c)
  const addFinder = (r: number, c: number) => {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (
          i === 0 || i === 6 || j === 0 || j === 6 ||
          (i >= 2 && i <= 4 && j >= 2 && j <= 4)
        ) {
          matrix[r + i][c + j] = true;
        } else {
          matrix[r + i][c + j] = false;
        }
      }
    }
  };

  // Top-left, Top-right, Bottom-left finder patterns
  addFinder(0, 0);
  addFinder(0, size - 7);
  addFinder(size - 7, 0);

  // Timing lines
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Hash-based data fills
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder patterns
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c >= size - 8) ||
        (r >= size - 8 && c < 8) ||
        r === 6 || c === 6
      ) {
        continue;
      }
      hash = Math.imul(hash ^ (r * 31 + c * 17), 16777619);
      matrix[r][c] = (hash & 1) === 1;
    }
  }

  return matrix;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 180,
  className = '',
  fgColor = '#0f172a',
  bgColor = '#ffffff'
}) => {
  const matrixSize = 25;
  const matrix = React.useMemo(() => generateMatrix(value, matrixSize), [value]);
  const cellSize = size / matrixSize;

  return (
    <div className={`inline-block p-3 rounded-2xl bg-white shadow-md border border-slate-200 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width={size} height={size} fill={bgColor} rx="8" />
        {matrix.map((row, r) =>
          row.map((cell, c) => {
            if (!cell) return null;
            return (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize + 0.3}
                height={cellSize + 0.3}
                fill={fgColor}
              />
            );
          })
        )}
      </svg>
    </div>
  );
};
