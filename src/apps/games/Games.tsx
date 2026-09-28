import { openApp } from "../registry";

const GAMES = [
  { id: "minesweeper", name: "Campo Minado", emoji: "💣", desc: "9×9, 10 minas" },
  { id: "snake", name: "Cobrinha", emoji: "🐍", desc: "Clássico, cada vez mais rápido" },
];

export default function Games() {
  return (
    <div className="flex h-full flex-col bg-[#f5f5f7] p-6 dark:bg-[#1c1c1e]">
      <p className="mb-4 text-[17px] font-semibold text-black dark:text-white">Jogos</p>
      <div className="grid grid-cols-2 gap-3">
        {GAMES.map((g) => (
          <button
            key={g.id}
            onClick={() => openApp(g.id)}
            className="flex flex-col items-center gap-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:ring-black/15 active:scale-[0.98] dark:bg-white/[0.06] dark:ring-white/10"
          >
            <span className="text-[40px]">{g.emoji}</span>
            <span className="text-[14px] font-semibold text-black dark:text-white">{g.name}</span>
            <span className="text-[11.5px] text-black/50 dark:text-white/50">{g.desc}</span>
          </button>
        ))}
      </div>
      <p className="mt-auto pt-4 text-center text-[11px] text-black/40 dark:text-white/40">
        Paciência e Xadrez chegam na próxima versão.
      </p>
    </div>
  );
}
