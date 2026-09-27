import { useEffect, useRef, useState } from "react";

const GRID = 20;
const CELL = 18;
const SIZE = GRID * CELL;

type Pt = { x: number; y: number };

function randFood(snake: Pt[]): Pt {
  while (true) {
    const p = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    if (!snake.some((s) => s.x === p.x && s.y === p.y)) return p;
  }
}

export default function Snake() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem("snake-best") || 0));
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);

  const state = useRef({
    snake: [{ x: 10, y: 10 }] as Pt[],
    dir: { x: 1, y: 0 } as Pt,
    nextDir: { x: 1, y: 0 } as Pt,
    food: { x: 15, y: 10 } as Pt,
  });

  const reset = () => {
    state.current = {
      snake: [{ x: 10, y: 10 }],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: randFood([{ x: 10, y: 10 }]),
    };
    setScore(0);
    setOver(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const d = state.current.nextDir;
      const k = e.key;
      if (k === "ArrowUp" && state.current.dir.y !== 1) state.current.nextDir = { x: 0, y: -1 };
      else if (k === "ArrowDown" && state.current.dir.y !== -1) state.current.nextDir = { x: 0, y: 1 };
      else if (k === "ArrowLeft" && state.current.dir.x !== 1) state.current.nextDir = { x: -1, y: 0 };
      else if (k === "ArrowRight" && state.current.dir.x !== -1) state.current.nextDir = { x: 1, y: 0 };
      else if ((k === " " || k === "Enter") && !running) { reset(); setRunning(true); }
      void d;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running]);

  useEffect(() => {
    if (!running || over) return;
    const speed = Math.max(70, 160 - Math.floor(score / 5) * 10);
    const t = setInterval(() => {
      const s = state.current;
      s.dir = s.nextDir;
      const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };

      // colisão com parede ou com o próprio corpo
      if (
        head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID ||
        s.snake.some((p) => p.x === head.x && p.y === head.y)
      ) {
        setOver(true);
        setRunning(false);
        setBest((b) => {
          const nb = Math.max(b, score);
          localStorage.setItem("snake-best", String(nb));
          return nb;
        });
        return;
      }

      s.snake.unshift(head);
      if (head.x === s.food.x && head.y === s.food.y) {
        setScore((sc) => sc + 1);
        s.food = randFood(s.snake);
      } else {
        s.snake.pop();
      }

      // desenha
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, SIZE, SIZE);
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(s.food.x * CELL + CELL / 2, s.food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        s.snake.forEach((p, i) => {
          ctx.fillStyle = i === 0 ? "#4ade80" : "#22c55e";
          ctx.fillRect(p.x * CELL + 1, p.y * CELL + 1, CELL - 2, CELL - 2);
        });
      }
    }, speed);
    return () => clearInterval(t);
  }, [running, over, score]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#0b1120] p-4">
      <div className="flex w-full max-w-sm items-center justify-between text-white">
        <p className="text-[14px] font-semibold">Pontos: {score}</p>
        <p className="text-[12px] opacity-60">Recorde: {best}</p>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={SIZE} height={SIZE} className="rounded-lg ring-1 ring-white/20" />
        {!running && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-black/60">
            <p className="text-[18px] font-bold text-white">{over ? "Fim de jogo" : "Cobrinha"}</p>
            {over && <p className="text-[13px] text-white/70">Pontuação: {score}</p>}
            <button
              onClick={() => { reset(); setRunning(true); }}
              className="rounded-full bg-green-500 px-5 py-2 text-[13px] font-semibold text-white hover:bg-green-600"
            >
              {over ? "Jogar de novo" : "Começar"}
            </button>
            <p className="text-[11px] text-white/50">Use as setas do teclado</p>
          </div>
        )}
      </div>
    </div>
  );
}
