import { useContextMenu } from "../store/ui";

export default function ContextMenu() {
  const { open, x, y, items, hide } = useContextMenu();
  if (!open) return null;

  /* Mantém o menu dentro da tela */
  const left = Math.min(x, window.innerWidth - 230);
  const top = Math.min(y, window.innerHeight - items.length * 30 - 30);

  return (
    <div className="fixed inset-0 z-[9500]" onPointerDown={hide} onContextMenu={(e) => { e.preventDefault(); hide(); }}>
      <div
        className="glass-strong absolute min-w-52 rounded-xl border border-black/10 p-1.5 text-[13px] text-black shadow-2xl dark:border-white/10 dark:text-white"
        style={{ left, top }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {items.map((item, i) =>
          item.separator ? (
            <div key={i} className="mx-2 my-1 border-t border-black/10 dark:border-white/10" />
          ) : (
            <button
              key={i}
              disabled={item.disabled}
              onClick={() => {
                hide();
                item.action?.();
              }}
              className={`flex w-full items-center justify-between gap-6 rounded-lg px-2.5 py-1 text-left ${
                item.disabled ? "opacity-35" : "hover:bg-accent hover:text-white"
              }`}
            >
              <span>{item.label}</span>
              {item.shortcut && <span className="text-[12px] opacity-50">{item.shortcut}</span>}
            </button>
          )
        )}
      </div>
    </div>
  );
}
