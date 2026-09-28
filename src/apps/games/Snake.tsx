import { useEffect, useRef, useState } from "react";
import type { AppProps } from "../registry";

const SIZE = 20, CELL = 18;
type Pt = { x: number; y: number };

type GameState = {
  snake: Pt[];
  dir: Pt;
  next: Pt;
  food: Pt;
  running: boolean;
  over: boolean;
  score: number;
  best: number;
};

const initialState = (): GameState => ({
  snake: [{ x: 10, y: 10 }],
  dir: { x: 1, y: 0 },
  next: { x: 1, y: 0 },
  food: { x: 15, y: 10 },
  running: false,
  over: false,
  score: 0,
  best: Number(localStorage.getItem("snake-best") || 0),
});

export default function Snake({ focused }: AppProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Todo o estado do jogo vive num ref: o loop NÃO depende de re-renders do React.
  const game = useRef<GameState>(initialState());
  // Apenas espelhos para a UI (placar, botão). Nunca reiniciam o loop.
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(game.current.best);
  const [idle, setIdle] = useState(true); // true => mostra botão Começar/Jogar de novo

  const reset = () => {
    const best = game.current.best;
    game.current = { ...initialState(), best, running: true };
    setScore(0);
    setIdle(false);
  };

  // Teclado: só responde quando a janela do jogo está focada; setas não rolam a página.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!focused) return;
      const s = game.current;
      const k = e.key;
      if (k.startsWith("Arrow")) e.preventDefault();
      if (k === "ArrowUp" && s.dir.y !== 1) s.next = { x: 0, y: -1 };
      else if (k === "ArrowDown" && s.dir.y !== -1) s.next = { x: 0, y: 1 };
      else if (k === "ArrowLeft" && s.dir.x !== 1) s.next = { x: -1, y: 0 };
      else if (k === "ArrowRight" && s.dir.x !== -1) s.next = { x: 1, y: 0 };
      else if (k === " " && !s.running) {
        e.preventDefault();
        reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focused]);

  // Game loop único e estável (rAF), montado uma vez. Desenho acontece aqui dentro.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const placeFood = (s: GameState) => {
      let p: Pt;
      do {
        p = { x: Math.floor(Math.random() * SIZE), y: Math.floor(Math.random() * SIZE) };
      } while (s.snake.some((q) => q.x === p.x && q.y === p.y));
      s.food = p;
    };

    const step = (s: GameState) => {
      s.dir = s.next;
      const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };
      if (
        head.x < 0 || head.x >= SIZE || head.y < 0 || head.y >= SIZE ||
        s.snake.some((q) => q.x === head.x && q.y === head.y)
      ) {
        s.running = false;
        s.over = true;
        if (s.score > s.best) {
          s.best = s.score;
          localStorage.setItem("snake-best", String(s.best));
          setBest(s.best);
        }
        setIdle(true);
        return;
      }
      s.snake.unshift(head);
      if (head.x === s.food.x && head.y === s.food.y) {
        s.score += 1;
        setScore(s.score);
        placeFood(s);
      } else {
        s.snake.pop();
      }
    };

    const draw = (s: GameState) => {
      const cv = canvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
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
    };

    const loop = (now: number) => {
      const s = game.current;
      const dt = Math.min(now - last, 100); // evita salto grande ao voltar de aba inativa
      last = now;
      if (s.running) {
        acc += dt;
        // velocidade aumenta com o score, SEM recriar intervalo
        const speed = Math.max(70, 160 - s.score * 3);
        while (acc >= speed && s.running) {
          acc -= speed;
          step(s);
        }
        if (!s.running) acc = 0;
      } else {
        acc = 0;
      }
      draw(s);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#0b0b0d]">
      <div className="flex w-[360px] items-center justify-between px-1 text-white">
        <span className="text-[13px] font-semibold">Placar: {score}</span>
        <span className="text-[12px] opacity-50">Recorde: {best}</span>
      </div>
      <canvas ref={canvasRef} width={SIZE * CELL} height={SIZE * CELL} className="rounded-xl ring-1 ring-white/10" />
      {idle && (
        <button onClick={reset} className="rounded-full bg-[#32d74b] px-6 py-2 text-[13px] font-semibold text-black">
          {game.current.over ? "Jogar de novo" : "Começar"}
        </button>
      )}
      <p className="text-[11px] text-white/40">Setas para mover · Espaço para começar</p>
    </div>
  );
}
