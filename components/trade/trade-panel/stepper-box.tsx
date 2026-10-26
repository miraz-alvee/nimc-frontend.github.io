import { Minus, Plus } from "lucide-react";

type Props = {
  value: string;
  label: string;
  side: "left" | "right";
  onPlus: () => void;
  onMinus: () => void;
};

export function StepperBox({ value, label, side, onPlus, onMinus }: Props) {
  const controls = (
    <div className="flex w-11 flex-col border-[#0092B8]/60 text-white first:border-r last:border-l shrink-0">
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={onPlus}
        className="flex flex-1 items-center justify-center border-b border-[#0092B8]/60 hover:bg-cyan-400/10 active:bg-cyan-400/20 transition-colors cursor-pointer"
      >
        <Plus className="size-5" />
      </button>
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={onMinus}
        className="flex flex-1 items-center justify-center hover:bg-cyan-400/10 active:bg-cyan-400/20 transition-colors cursor-pointer"
      >
        <Minus className="size-5" />
      </button>
    </div>
  );

  return (
    <div className="flex h-[74px] w-52 overflow-hidden rounded-2xl border border-[#0092B8] bg-[#053345]/85 backdrop-blur shadow-md font-albert-sans">
      {side === "left" && controls}
      <div className="flex flex-1 flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white tracking-tight leading-tight">
          {value}
        </span>
        <span className="text-xs text-white/70 font-normal leading-tight">
          {label}
        </span>
      </div>
      {side === "right" && controls}
    </div>
  );
}
