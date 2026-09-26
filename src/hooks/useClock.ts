import { useEffect, useState } from "react";

const WD = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MO = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Relógio estilo macOS: "sex 26 set 14:03" + atualização por segundo. */
export function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function formatMenubar(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${WD[d.getDay()]} ${d.getDate()} ${MO[d.getMonth()]} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
