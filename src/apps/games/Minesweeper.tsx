import { useCallback, useState } from "react";

const ROWS = 9;
const COLS = 9;
const MINES = 10;

type Cell = { mine: boolean; open: boolean; flag: boolean; adj: number };

function emptyBoard(): Cell[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ mine: false, open: false, flag: false, adj: 0 }))
  );
}

function plant(board: Cell[][], safeR: number, safeC: number): Cell[][] {
  const b = board.map((r) => r.map((c) => ({ ...c })));
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (b[r][c].mine || (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1)) continue;
    b[r][c].mine = true;
    placed++;
  }
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      if (b[r][c].mine) continue;
      let n = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && b[nr][nc].mine) n++;
        }
      b[r][c].adj = n;
    }
  return b;
}

const NUM_COLORS = ["", "#2563eb", "#16a34a", "#dc2626", "#7c3aed", "#b45309", "#0891b2", "#111", "#666"];

export default function Minesweeper() {
  const [board, setBoard] = useState<Cell[][]>(emptyBoard);
  const [started, setStarted] = useState(false);
  const [dead, setDead] = useState(false);
  const [won, setWon] = useState(false);

  const flags = board.flat().filter((c) => c.flag).length;

  const checkWin = useCallback((b: Cell[][]) => {
    const allOpen = b.flat().every((c) => c.mine || c.open);
    if (allOpen) setWon(true);
  }, []);

  const reveal = (r: number, c: number) => {
    if (dead || won) return;
    let b = board;
    if (!started) {
      b = plant(board, r, c);
      setStarted(true);
    }
    if (b[r][c].flag || b[r][c].open) return;
    b = b.map((row) => row.map((cell) => ({ ...cell })));

    if (b[r][c].mine) {
      b.flat().forEach((cell) => { if (cell.mine) cell.open = true; });
      setBoard(b);
      setDead(true);
      return;
    }

    const stack: [number, number][] = [[r, c]];
    while (stack.length) {
      const [cr, cc] = stack.pop()!;
      const cell = b[cr][cc];
      if (cell.open || cell.flag) continue;
      cell.open = true;
      if (cell.adj === 0) {
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++) {
            const nr = cr + dr, nc = cc + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !b[nr][nc].open) stack.push([nr, nc]);
          }
      }
    }
    setBoard(b);
    checkWin(b);
  };

  const toggleFlag = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (dead || won || board[r][c].open) return;
    const b = board.map((row) => row.map((cell) => ({ ...cell })));
    b[r][c].flag = !b[r][c].flag;
    setBoard(b);
  };

  const reset = () => {
    setBoard(emptyBoard());
    setStarted(false);
    setDead(false);
    setWon(false);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#bdbdbd] p-4 select-none">
      <div className="flex w-full max-w-xs items-center justify-between rounded-lg bg-[#c0c0c0] px-3 py-2 shadow-inner">
        <span className="rounded bg-black px-2 py-0.5 font-mono text-[18px] font-bold text-red-500">
          {String(MINES - flags).padStart(3, "0")}
        </span>
        <button onClick={reset} className="text-[24px] leading-none" title="Novo jogo">
          {dead ? "😵" : won ? "😎" : "🙂"}
        </button>
        <span className="rounded bg-black px-2 py-0.5 font-mono text-[18px] font-bold text-red-500">
          {String(flags).padStart(3, "0")}
        </span>
      </div>

      <div className="rounded-lg bg-[#c0c0c0] p-1.5 shadow-inner" style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 2 }}>
        {board.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => reveal(r, c)}
              onContextMenu={(e) => toggleFlag(e, r, c)}
              className={`flex h-8 w-8 items-center justify-center text-[15px] font-bold ${
                cell.open
                  ? "bg-[#d6d6d6]"
                  : "bg-[#e8e8e8] shadow-[inset_-2px_-2px_0_#7b7b7b,inset_2px_2px_0_#fff] hover:bg-[#f0f0f0]"
              }`}
              style={{ color: cell.open && !cell.mine ? NUM_COLORS[cell.adj] : undefined }}
            >
              {cell.open ? (cell.mine ? "💣" : cell.adj || "") : cell.flag ? "🚩" : ""}
            </button>
          ))
        )}
      </div>

      {(dead || won) && (
        <p className="text-[14px] font-semibold text-black/70">
          {won ? "Você venceu! Clique no rosto para jogar de novo." : "Boom! Clique no rosto para tentar de novo."}
        </p>
      )}
    </div>
  );
}
