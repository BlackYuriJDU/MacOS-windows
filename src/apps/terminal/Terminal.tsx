import { useEffect, useRef, useState } from "react";
import { ipc } from "../../lib/ipc";
import { useWindows } from "../../store/windows";
import type { MachineInfo } from "../../lib/types";

interface Line {
  id: number;
  text: string;
}

let seq = 0;

export default function Terminal({ focused, winId }: { focused: boolean; winId: string }) {
  const [lines, setLines] = useState<Line[]>([
    { id: ++seq, text: "Mac OS Terminal 0.1 — digite `help` para os comandos disponíveis." },
  ]);
  const [input, setInput] = useState("");
  const [cwd, setCwd] = useState<string | null>(null);
  const [info, setInfo] = useState<MachineInfo | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ipc.homeDir().then(setCwd);
    ipc.machineInfo().then(setInfo).catch(() => {});
  }, []);

  useEffect(() => {
    if (focused) inputRef.current?.focus();
  }, [focused]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  const push = (text: string) => setLines((ls) => [...ls, { id: ++seq, text }]);

  const resolve = (arg: string): string | null => {
    if (!cwd) return null;
    if (!arg || arg === "~") return cwd;
    if (arg === "..") {
      const up = cwd.replace(/[\\/][^\\/]+$/, "");
      return up.length >= 2 && up.length < cwd.length ? up : cwd;
    }
    if (/^[a-zA-Z]:[\\/]/.test(arg)) return arg;
    return `${cwd}\\${arg}`;
  };

  const run = async (raw: string) => {
    const line = raw.trim();
    push(`${promptText()} ${line}`);
    if (!line) return;
    const [cmd, ...args] = line.split(/\s+/);
    const arg = args.join(" ");

    switch (cmd) {
      case "help":
        push("Comandos: help, clear, date, echo, whoami, hostname, uname, neofetch, pwd, ls, cd, exit");
        break;
      case "clear":
        setLines([]);
        break;
      case "date":
        push(new Date().toLocaleString("pt-BR"));
        break;
      case "echo":
        push(arg);
        break;
      case "whoami":
        push(info?.hostname?.toLowerCase() ?? "usuário");
        break;
      case "hostname":
        push(info?.hostname ?? "macos");
        break;
      case "pwd":
        push(cwd ?? "~");
        break;
      case "uname":
        push(
          arg.includes("-a")
            ? `Mac OS 0.1.0 ${info?.kernel_version ?? "unknown"} ${info?.arch ?? ""} ${info?.hostname ?? ""}`
            : "Mac OS"
        );
        break;
      case "cd": {
        const target = resolve(arg || "~");
        if (!target) break;
        try {
          const entries = await ipc.fsList(target);
          if (entries) setCwd(target);
          else push(`cd: ${arg}: não encontrado`);
        } catch {
          push(`cd: ${arg}: não encontrado`);
        }
        break;
      }
      case "ls": {
        const target = resolve(arg);
        if (!target) break;
        try {
          const entries = await ipc.fsList(target);
          if (!entries.length) push("(vazio)");
          else push(entries.map((e) => (e.is_dir ? `${e.name}/` : e.name)).join("   "));
        } catch {
          push(`ls: ${arg || target}: não foi possível ler`);
        }
        break;
      }
      case "neofetch":
        push(asciiLogo());
        push(
          [
            `usuário@${info?.hostname ?? "macos"}`,
            "-".repeat(20),
            `SO: ${info?.os_name ?? "—"} ${info?.os_version ?? ""}`,
            `Kernel: ${info?.kernel_version ?? "—"}`,
            `Terminal: Mac OS Terminal`,
            `CPU: ${info?.cpu ?? "—"} (${info?.cores ?? "?"} núcleos)`,
            `Memória: ${info?.memory_gb?.toFixed(1) ?? "—"} GB`,
            `Armazenamento: ${info?.storage_gb?.toFixed(0) ?? "—"} GB`,
            `Arquitetura: ${info?.arch ?? "—"}`,
          ].join("\n")
        );
        break;
      case "exit":
        window.dispatchEvent(new CustomEvent("macos:close-terminal"));
        useWindows.getState().close(winId);
        break;
      default:
        push(`comando não encontrado: ${cmd} (digite help)`);
    }
  };

  const promptText = () => `arthur@macos ${cwd ? shortPath(cwd) : "~"} %`;

  return (
    <div className="flex h-full flex-col bg-[#111214] p-0 font-mono text-[12.5px] text-[#37e57b]" onClick={() => inputRef.current?.focus()}>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 pt-2">
        {lines.map((l) => (
          <pre key={l.id} className="whitespace-pre-wrap break-words leading-relaxed">
            {l.text}
          </pre>
        ))}
        <div className="flex items-center gap-2">
          <span className="shrink-0">{promptText()}</span>
          <input
            ref={inputRef}
            value={input}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = input;
                setInput("");
                void run(v);
              }
            }}
            className="w-full bg-transparent text-[#37e57b] caret-[#37e57b] outline-none"
          />
        </div>
      </div>
    </div>
  );
}

function shortPath(p: string): string {
  const parts = p.split(/[\\/]/);
  return parts.length > 3 ? `…/${parts.slice(-2).join("/")}` : parts.slice(-1)[0] || p;
}

function asciiLogo(): string {
  return [
    "        .-~~~-.        ",
    "      .'       '.      ",
    "     /   _____   \\     ",
    "    |   /     \\   |    ",
    "    |  |  (@)  |  |    ",
    "    |   \\_____/   |    ",
    "     \\           /     ",
    "      '.       .'      ",
    "        '-...-'        ",
  ].join("\n");
}
