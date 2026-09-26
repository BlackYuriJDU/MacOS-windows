import { useEffect, useState } from "react";

type Op = "+" | "-" | "×" | "÷" | null;

const apply = (a: number, b: number, op: Op): number => {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "×": return a * b;
    case "÷": return b === 0 ? NaN : a / b;
    default: return b;
  }
};

const fmt = (n: number): string => {
  if (!isFinite(n)) return "Erro";
  const s = Math.abs(n) >= 1e12 ? n.toExponential(6) : String(Math.round(n * 1e10) / 1e10);
  return s.length > 14 ? Number(n.toPrecision(12)).toString() : s;
};

export default function Calculator({ focused }: { focused: boolean }) {
  const [display, setDisplay] = useState("0");
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<Op>(null);
  const [fresh, setFresh] = useState(true);

  const digit = (d: string) => {
    if (fresh) {
      setDisplay(d === "." ? "0." : d);
      setFresh(false);
    } else if (d === "." && display.includes(".")) {
      return;
    } else if (display.replace(/[-.]/g, "").length < 12) {
      setDisplay(display + d);
    }
  };

  const operator = (o: Op) => {
    const v = parseFloat(display);
    if (acc !== null && op && !fresh) {
      const r = apply(acc, v, op);
      setAcc(r);
      setDisplay(fmt(r));
    } else {
      setAcc(v);
    }
    setOp(o);
    setFresh(true);
  };

  const equals = () => {
    const v = parseFloat(display);
    if (acc !== null && op) {
      const r = apply(acc, v, op);
      setDisplay(fmt(r));
      setAcc(null);
      setOp(null);
      setFresh(true);
    }
  };

  const clear = () => {
    setDisplay("0");
    setAcc(null);
    setOp(null);
    setFresh(true);
  };

  /* Teclado quando a janela está focada */
  useEffect(() => {
    if (!focused) return;
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) digit(e.key);
      else if (e.key === "." || e.key === ",") digit(".");
      else if (e.key === "+") operator("+");
      else if (e.key === "-") operator("-");
      else if (e.key === "*") operator("×");
      else if (e.key === "/") { e.preventDefault(); operator("÷"); }
      else if (e.key === "Enter" || e.key === "=") { e.preventDefault(); equals(); }
      else if (e.key === "Escape") clear();
      else if (e.key === "Backspace") setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : "0"));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused, display, acc, op, fresh]);

  const Key = ({
    label,
    onClick,
    variant = "num",
    wide,
  }: {
    label: string;
    onClick: () => void;
    variant?: "num" | "fn" | "op";
    wide?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center justify-center rounded-xl text-[17px] font-medium transition active:brightness-125 ${
        wide ? "col-span-2" : ""
      } ${
        variant === "op"
          ? "bg-[#ff9f0a] text-white"
          : variant === "fn"
            ? "bg-[#5a5a5f] text-white"
            : "bg-[#333336] text-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-[#1c1c1e] p-2 pt-1">
      <div className="flex h-16 shrink-0 items-end justify-end px-3 pb-1">
        <span className="truncate text-right text-[40px] font-light leading-none text-white">{display}</span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-4 gap-1.5">
        <Key label={display !== "0" || acc !== null ? "C" : "AC"} variant="fn" onClick={clear} />
        <Key label="+/−" variant="fn" onClick={() => setDisplay((d) => (d.startsWith("-") ? d.slice(1) : "-" + d))} />
        <Key label="%" variant="fn" onClick={() => setDisplay((d) => fmt(parseFloat(d) / 100))} />
        <Key label="÷" variant="op" onClick={() => operator("÷")} />

        {["7", "8", "9"].map((d) => <Key key={d} label={d} onClick={() => digit(d)} />)}
        <Key label="×" variant="op" onClick={() => operator("×")} />

        {["4", "5", "6"].map((d) => <Key key={d} label={d} onClick={() => digit(d)} />)}
        <Key label="−" variant="op" onClick={() => operator("-")} />

        {["1", "2", "3"].map((d) => <Key key={d} label={d} onClick={() => digit(d)} />)}
        <Key label="+" variant="op" onClick={() => operator("+")} />

        <Key wide label="0" onClick={() => digit("0")} />
        <Key label="," onClick={() => digit(".")} />
        <Key label="=" variant="op" onClick={equals} />
      </div>
    </div>
  );
}
