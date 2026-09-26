import { useEffect, useState } from "react";
import { ipc } from "../lib/ipc";
import type { FsEntry } from "../lib/types";
import { useSettings } from "../store/settings";
import { useContextMenu } from "../store/ui";
import { openApp } from "../apps/registry";
import { FolderGlyph, FileGlyph } from "../components/icons";

export default function Desktop() {
  const wallpaper = useSettings((s) => s.wallpaper);
  const showCtx = useContextMenu((s) => s.show);
  const [entries, setEntries] = useState<FsEntry[] | null>(null);

  useEffect(() => {
    ipc
      .homeDir()
      .then((h) => ipc.fsList(`${h}\\Desktop`))
      .then((es) => setEntries(es.slice(0, 24)))
      .catch(() => setEntries([]));
  }, []);

  return (
    <div
      className={`absolute inset-0 ${wallpaper}`}
      onContextMenu={(e) => {
        e.preventDefault();
        showCtx(e.clientX, e.clientY, [
          { label: "Novo Terminal", action: () => openApp("terminal") },
          { separator: true },
          {
            label: "Alterar Papel de Parede…",
            action: () => openApp("settings", { forceNew: true, props: { initialPane: "Papel de Parede" } }),
          },
          { label: "Sobre Este Mac", action: () => openApp("about") },
        ]);
      }}
    >
      {/* Ícones da Mesa real (pasta Desktop do usuário) — coluna à direita, como no macOS */}
      <div className="absolute right-3 top-9 flex max-h-[calc(100%-120px)] flex-col flex-wrap-reverse gap-1">
        {(entries ?? []).map((e) => (
          <button
            key={e.path}
            onDoubleClick={() =>
              e.is_dir ? openApp("finder", { forceNew: true, props: { initialPath: e.path } }) : openApp("finder", { forceNew: true, props: { initialPath: e.path } })
            }
            className="flex w-20 flex-col items-center gap-1 rounded-lg p-1.5 hover:bg-white/15"
          >
            {e.is_dir ? (
              <FolderGlyph className="h-11 w-11 drop-shadow" />
            ) : (
              <FileGlyph className="h-11 w-11 drop-shadow" />
            )}
            <span className="w-full truncate text-center text-[11px] font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {e.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
