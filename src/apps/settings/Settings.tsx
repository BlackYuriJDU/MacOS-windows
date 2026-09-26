import { useState } from "react";
import { useSettings, type Theme } from "../../store/settings";
import { Logo } from "../../components/Logo";

const WALLPAPERS = [
  { id: "wp-0", label: "Crepúsculo" },
  { id: "wp-1", label: "Oceano" },
  { id: "wp-2", label: "Areia" },
  { id: "wp-3", label: "Rubí" },
  { id: "wp-solid-0", label: "Azul" },
  { id: "wp-solid-1", label: "Noite" },
  { id: "wp-solid-2", label: "Ameixa" },
  { id: "wp-solid-3", label: "Musgo" },
];

const PANES = ["Aparência", "Papel de Parede", "Dock e Barra de Menus", "Modo Foco", "Sobre"] as const;
type Pane = (typeof PANES)[number];

export default function Settings({ props: p }: { props?: Record<string, unknown> }) {
  const cfg = useSettings();
  const initialPane = typeof p?.initialPane === "string" ? (p.initialPane as string) : undefined;
  const [pane, setPane] = useState<Pane>((PANES as readonly string[]).includes(initialPane ?? "") ? (initialPane as Pane) : "Aparência");

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <p className="text-[13px]">{label}</p>
      {children}
    </div>
  );

  const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="rounded-xl bg-white/60 p-1 px-4 shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
      <p className="mt-2 mb-1 text-[11px] font-semibold uppercase tracking-wide opacity-40">{title}</p>
      {children}
    </section>
  );

  return (
    <div className="flex h-full text-[13px] text-black dark:text-white">
      <div className="w-52 shrink-0 border-r border-black/10 bg-black/[0.03] p-2 dark:border-white/10 dark:bg-white/[0.03]">
        {PANES.map((p) => (
          <button
            key={p}
            onClick={() => setPane(p)}
            className={`mb-0.5 block w-full rounded-lg px-3 py-1.5 text-left ${
              pane === p ? "bg-accent text-white" : "hover:bg-black/10 dark:hover:bg-white/10"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
        {pane === "Aparência" && (
          <Group title="Tema">
            <Row label="Aparência">
              <div className="flex gap-0.5 rounded-lg bg-black/10 p-0.5 dark:bg-white/10">
                {(["light", "dark", "auto"] as Theme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => cfg.set({ theme: t })}
                    className={`rounded-md px-3 py-1 text-[12px] ${
                      cfg.theme === t ? "bg-white shadow-sm dark:bg-white/20" : "opacity-60"
                    }`}
                  >
                    {t === "light" ? "Claro" : t === "dark" ? "Escuro" : "Automático"}
                  </button>
                ))}
              </div>
            </Row>
          </Group>
        )}

        {pane === "Papel de Parede" && (
          <Group title="Papel de parede">
            <div className="grid grid-cols-4 gap-2 py-2">
              {WALLPAPERS.map((w) => (
                <button
                  key={w.id}
                  onClick={() => cfg.set({ wallpaper: w.id })}
                  className={`overflow-hidden rounded-lg ring-2 transition ${
                    cfg.wallpaper === w.id ? "ring-accent" : "ring-transparent hover:ring-black/20"
                  }`}
                >
                  <div className={`${w.id} h-16 w-full`} />
                  <p className="bg-black/5 py-1 text-[11px] dark:bg-white/10">{w.label}</p>
                </button>
              ))}
            </div>
          </Group>
        )}

        {pane === "Dock e Barra de Menus" && (
          <>
            <Group title="Dock">
              <Row label={`Tamanho dos ícones (${cfg.dockSize}px)`}>
                <input
                  type="range"
                  min={40}
                  max={68}
                  value={cfg.dockSize}
                  onChange={(e) => cfg.set({ dockSize: Number(e.target.value) })}
                  className="w-48 accent-[#0a84ff]"
                />
              </Row>
              <Row label="Ampliação">
                <Toggle on={cfg.dockMagnify} onChange={(v) => cfg.set({ dockMagnify: v })} />
              </Row>
              <Row label="Ocultar automaticamente">
                <Toggle on={cfg.dockAutohide} onChange={(v) => cfg.set({ dockAutohide: v })} />
              </Row>
            </Group>
            <p className="px-1 text-[11.5px] leading-relaxed opacity-50">
              A ampliação usa queda parabólica — o ícone sob o cursor cresce e os vizinhos se afastam, como no Dock original.
            </p>
          </>
        )}

        {pane === "Modo Foco" && (
          <Group title="Modo Foco">
            <div className="space-y-2 py-2 text-[12.5px] leading-relaxed">
              <p>
                Ao entrar no ambiente, o Modo Foco congela os aplicativos em segundo plano com a mesma técnica usada
                pelo Process Explorer (NtSuspendProcess) e os retoma na saída. Processos do sistema ficam sempre
                protegidos.
              </p>
              <p className="opacity-60">
                Processos protegidos incluem: explorer, dwm, csrss, svchost, MsMpEng, msedgewebview2 (a própria
                interface) e todos os processos do sistema.
              </p>
              <p className="opacity-60">
                A configuração por aplicativo e o modo “finalizar” permanente ficam para a v0.2.
              </p>
            </div>
          </Group>
        )}

        {pane === "Sobre" && (
          <Group title="Sobre">
            <div className="flex flex-col items-center gap-2 py-4">
              <Logo size={72} />
              <p className="text-[15px] font-semibold">Mac OS</p>
              <p className="text-[12px] opacity-60">Versão 0.1.0 (Foco)</p>
              <p className="max-w-72 text-center text-[11.5px] leading-relaxed opacity-50">
                Projeto de fã, sem qualquer afiliação com a Apple. macOS é marca registrada da Apple Inc. Todos os
                visuais foram recriados — nenhum asset da Apple é distribuído.
              </p>
            </div>
          </Group>
        )}
      </div>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative h-6 w-10 rounded-full transition ${on ? "bg-accent" : "bg-black/20 dark:bg-white/20"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`}
      />
    </button>
  );
}
