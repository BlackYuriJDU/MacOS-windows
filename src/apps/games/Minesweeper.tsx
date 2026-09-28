import { useCallback, useEffect, useState } from "react";

const ROWS = 9, COLS = 9, MINES = 10;
type Cell = { mine: boolean; open: boolean; flag: boolean; n: number };

function build(): Cell[][] {
  const g: Cell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ mine: false, open: false, flag: false, n: 0 }))
  );
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS), c = Math.floor(Math.random() * COLS);
    if (!g[r][c].mine) { g[r][c].mine = true; placed++; }
  }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (g[r][c].mine) continue;
    let n = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && g[nr][nc].mine) n++;
    }
    g[r][c].n = n;
  }
  return g;
}

const NUM_COLORS = ["", "#0a84ff", "#32d74b", "#ff453a", "#5e5ce6", "#ff9f0a", "#64d2ff", "#bf5af2", "#ff375f"];

export default function Minesweeper() {
  const [grid, setGrid] = useState<Cell[][]>(build);
  const [state, setState] = useState<"playing" | "won" | "lost">("playing");
  const [flags, setFlags] = useState(0);
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (state !== "playing") return;
    const t = setInterval(() => setTime((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  const reset = () => { setGrid(build()); setState("playing"); setFlags(0); setTime(0); };

  const reveal = useCallback((g: Cell[][], r: number, c: number) => {
    const cell = g[r][c];
    if (cell.open || cell.flag) return;
    cell.open = true;
    if (cell.n === 0 && !cell.mine) {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) reveal(g, nr, nc);
      }
    }
  }, []);

  const click = (r: number, c: number) => {
    if (state !== "playing") return;
    const g = grid.map((row) => row.map((cell) => ({ ...cell })));
    const cell = g[r][c];
    if (cell.flag) return;
    if (cell.mine) {
      g.forEach((row) => row.forEach((cl) => { if (cl.mine) cl.open = true; }));
      setGrid(g); setState("lost");
      return;
    }
    reveal(g, r, c);
    setGrid(g);
    const closed = g.flat().filter((cl) => !cl.open).length;
    if (closed === MINES) setState("won");
  };

  const rightClick = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (state !== "playing") return;
    const g = grid.map((row) => row.map((cell) => ({ ...cell })));
    const cell = g[r][c];
    if (cell.open) return;
    cell.flag = !cell.flag;
    setFlags((f) => f + (cell.flag ? 1 : -1));
    setGrid(g);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#f5f5f7] dark:bg-[#1c1c1e]">
      <div className="flex w-[312px] items-center justify-between rounded-xl bg-white px-4 py-2 shadow-sm ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10">
        <span className="text-[13px] font-semibold text-red-500">💣 {MINES - flags}</span>
        <button onClick={reset} className="text-[20px]">
          {state === "won" ? "😎" : state === "lost" ? "😵" : "🙂"}
        </button>
        <span className="text-[13px] font-semibold tabular-nums opacity-60">⏱ {time}</span>
      </div>
      <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${COLS}, 32px)` }}>
          {grid.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => click(r, c)}
                onContextMenu={(e) => rightClick(e, r, c)}
                className={`flex h-8 w-8 items-center justify-center border border-black/5 text-[14px] font-bold dark:border-white/5 ${
                  cell.open
                    ? cell.mine
                      ? "bg-red-500"
                      : "bg-black/[0.03] dark:bg-white/[0.06]"
                    : "bg-black/[0.08] hover:bg-black/[0.12] dark:bg-white/[0.12] dark:hover:bg-white/[0.18]"
                }`}
                style={{ color: cell.open && !cell.mine ? NUM_COLORS[cell.n] : undefined }}
              >
                {cell.open ? (cell.mine ? "💣" : cell.n || "") : cell.flag ? "🚩" : ""}
              </button>
            ))
          )}
        </div>
      </div>
      {state !== "playing" && (
        <p className="text-[13px] font-medium">
          {state === "won" ? "Você venceu! 🎉" : "Você perdeu. Clique no rosto para tentar de novo."}
        </p>
      )}
    </div>
  );
}
