import { useState } from "react";
import { useOverlays } from "../store/ui";
import { APPS, openApp } from "../apps/registry";
import { Magnifier } from "../components/icons";

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default function Launchpad() {
  const setLaunchpad = useOverlays((s) => s.setLaunchpad);
  const [q, setQ] = useState("");

  const apps = APPS.filter((a) => (q ? norm(a.name).includes(norm(q)) : true));

  return (
    <div
      className="fixed inset-0 z-[8000] flex flex-col items-center gap-10 bg-black/35 pt-16 backdrop-blur-2xl"
      onPointerDown={() => setLaunchpad(false)}
    >
      <div className="glass-strong flex w-64 items-center gap-2 rounded-xl px-3" onPointerDown={(e) => e.stopPropagation()}>
        <Magnifier className="h-4 w-4 opacity-50" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar"
          className="h-9 w-full bg-transparent text-[13px] text-black outline-none dark:text-white"
        />
      </div>

      <div
        className="grid max-w-4xl grid-cols-6 gap-x-10 gap-y-8"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {apps.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              onClick={() => {
                openApp(a.id);
                setLaunchpad(false);
              }}
              className="flex w-24 flex-col items-center gap-2"
            >
              <span className="h-[68px] w-[68px] drop-shadow-lg transition-transform active:scale-95">
                <Icon />
              </span>
              <span className="text-[12px] font-medium text-white drop-shadow">{a.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
