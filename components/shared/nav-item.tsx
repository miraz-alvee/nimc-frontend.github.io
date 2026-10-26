import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick?: () => void;
};

export function NavItem({ icon: Icon, label, active, danger, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "font-albert-sans relative flex h-20 w-full flex-col items-center justify-center gap-2 border-b border-cyan-400/30 text-sm text-white transition-colors last:border-b-0 hover:bg-cyan-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
        active && "bg-cyan-400/15 text-cyan-400",
        danger && "text-red-500 hover:bg-red-500/10"
      )}
    >
      {active && <span className="absolute left-0 top-0 h-full w-1 bg-cyan-400" />}
      <Icon className="size-6" strokeWidth={1.5} />
      <h1 className="font-albert-sans text-[16px] font-medium leading-[100%]">{label}</h1>
    </button>
  );
}
