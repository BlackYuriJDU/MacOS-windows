import { TrashIcon } from "../../components/icons";

export default function Trash() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#f2f2f4] text-black dark:bg-[#1e1e20] dark:text-white">
      <TrashIcon className="h-24 w-24 opacity-80" />
      <p className="text-[14px] font-medium opacity-70">O Lixo está vazio</p>
      <p className="max-w-72 text-center text-[11.5px] leading-relaxed opacity-45">
        v0.1: a lixeira é apenas visual — nenhum arquivo real do Windows é movido ou apagado por este ambiente.
      </p>
    </div>
  );
}
