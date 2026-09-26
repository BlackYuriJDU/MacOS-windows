import { useEffect, useState } from "react";
import { ipc } from "../../lib/ipc";
import type { MachineInfo } from "../../lib/types";
import { Logo } from "../../components/Logo";

export default function About() {
  const [info, setInfo] = useState<MachineInfo | null>(null);

  useEffect(() => {
    ipc.machineInfo().then(setInfo).catch(() => {});
  }, []);

  const rows: [string, string][] = info
    ? [
        ["Dispositivo", info.hostname || "—"],
        ["Chip", `${info.cpu || "—"} · ${info.cores} núcleos`],
        ["Memória", `${info.memory_gb.toFixed(1)} GB`],
        ["Armazenamento", `${info.storage_gb.toFixed(0)} GB`],
        ["Sistema", `${info.os_name} ${info.os_version}`],
        ["Kernel", info.kernel_version || "—"],
        ["Arquitetura", info.arch],
      ]
    : [];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 bg-[#f2f2f4] p-6 text-[13px] text-black dark:bg-[#1e1e20] dark:text-white">
      <Logo size={84} />
      <p className="mt-2 text-[19px] font-semibold leading-tight">Mac OS</p>
      <p className="text-[12px] opacity-55">Versão 0.1.0 (Foco)</p>

      <div className="mt-4 w-full max-w-80 rounded-xl bg-white/70 p-1 px-4 shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
        {info === null ? (
          <p className="py-4 text-center text-[12px] opacity-50">Detectando hardware…</p>
        ) : (
          rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-black/5 py-2 text-[12.5px] last:border-0 dark:border-white/5">
              <span className="opacity-55">{k}</span>
              <span className="max-w-[60%] truncate text-right" title={v}>
                {v}
              </span>
            </div>
          ))
        )}
      </div>

      <p className="mt-4 max-w-80 text-center text-[10.5px] leading-relaxed opacity-45">
        Ambiente estilo macOS executando sobre Windows. Projeto de fã, sem afiliação com a Apple. macOS é marca
        registrada da Apple Inc.
      </p>
    </div>
  );
}
