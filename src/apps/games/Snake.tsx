import { useEffect, useRef, useState } from "react";

const SIZE = 20, CELL = 18;
type Pt = { x: number; y: number };

export default function Snake() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem("snake-best") || 0));
  const [over, setOver] = useState(false);
  const [running, setRunning] = useState(false);
  const state = useRef({ snake: [{ x: 10, y: 10 }] as Pt[], dir: { x: 1, y: 0 }, next: { x: 1, y: 0 }, food: { x: 15, y: 10 } as Pt });

  const placeFood = () => {
    const s = state.current;
    let p: Pt;
    do {
      p = { x: Math.floor(Math.random() * SIZE), y: Math.floor(Math.random() * SIZE) };
    } while (s.snake.some((q) => q.x === p.x && q.y === p.y));
    s.food = p;
  };

  const reset = () => {
    state.current = { snake: [{ x: 10, y: 10 }], dir: { x: 1, y: 0 }, next: { x: 1, y: 0 }, food: { x: 15, y: 10 } };
    setScore(0); setOver(false); setRunning(true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = state.current;
      const k = e.key;
      if (k === "ArrowUp" && s.dir.y !== 1) s.next = { x: 0, y: -1 };
      else if (k === "ArrowDown" && s.dir.y !== -1) s.next = { x: 0, y: 1 };
      else if (k === "ArrowLeft" && s.dir.x !== 1) s.next = { x: -1, y: 0 };
      else if (k === "ArrowRight" && s.dir.x !== -1) s.next = { x: 1, y: 0 };
      else if (k === " " && !running) { e.preventDefault(); reset(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running]);

  useEffect(() => {
    if (!running || over) return;
    const speed = Math.max(70, 160 - score * 3);
    const t = setInterval(() => {
      const s = state.current;
      s.dir = s.next;
      const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };
      if (head.x < 0 || head.x >= SIZE || head.y < 0 || head.y >= SIZE || s.snake.some((q) => q.x === head.x && q.y === head.y)) {
        setOver(true); setRunning(false);
        if (score > best) { setBest(score); localStorage.setItem("snake-best", String(score)); }
        return;
      }
      s.snake.unshift(head);
      if (head.x === s.food.x && head.y === s.food.y) { setScore((v) => v + 1); placeFood(); }
      else s.snake.pop();
    }, speed);
    return () => clearInterval(t);
  }, [running, over, score, best]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const s = state.current;
    ctx.fillStyle = "#0b0b0d";
    ctx.fillRect(0, 0, SIZE * CELL, SIZE * CELL);
    // comida
    ctx.fillStyle = "#ff453a";
    ctx.beginPath();
    ctx.arc(s.food.x * CELL + CELL / 2, s.food.y * CELL + CELL / 2, CELL / 2.4, 0, Math.PI * 2);
    ctx.fill();
    // cobra
    s.snake.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? "#32d74b" : `rgba(50, 215, 75, ${1 - (i / s.snake.length) * 0.5})`;
      ctx.beginPath();
      ctx.roundRect(p.x * CELL + 1, p.y * CELL + 1, CELL - 2, CELL - 2, 5);
      ctx.fill();
    });
  });

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#0b0b0d]">
      <div className="flex w-[360px] items-center justify-between px-1 text-white">
        <span className="text-[13px] font-semibold">Placar: {score}</span>
        <span className="text-[12px] opacity-50">Recorde: {best}</span>
      </div>
      <canvas ref={canvasRef} width={SIZE * CELL} height={SIZE * CELL} className="rounded-xl ring-1 ring-white/10" />
      {!running && (
        <button onClick={reset} className="rounded-full bg-[#32d74b] px-6 py-2 text-[13px] font-semibold text-black">
          {over ? "Jogar de novo" : "Começar"}
        </button>
      )}
      <p className="text-[11px] text-white/40">Setas para mover · Espaço para começar</p>
    </div>
  );
}
