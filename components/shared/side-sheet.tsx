"use client";

import { ArrowLeft, X } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Props = SheetProps & {
  side: "left" | "right";
  title: string;
  showHeader?: boolean;
  headerBorder?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function SideSheet({
  open,
  onOpenChange,
  side,
  title,
  showHeader = true,
  headerBorder = false,
  className,
  children,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side={side}
        className={cn(
          "top-5! bottom-5! max-h-[calc(100vh-2.5rem)] w-90! gap-0 rounded-xl border border-[#0092B8] bg-[#053345] p-0 backdrop-blur text-white sm:max-w-90! [&>button]:hidden flex flex-col overflow-y-auto overflow-x-hidden no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          side === "left" ? "left-27.5" : "right-27.5 left-auto",
          className
        )}
      >
        <SheetDescription className="sr-only">{title}</SheetDescription>

        {showHeader ? (
          <div
            className={cn(
              "sticky top-0 z-10 bg-[#053345] flex items-center justify-center pt-6 pb-4 shrink-0",
              headerBorder && "border-b border-[#0092B8]/40"
            )}
          >
            {side === "left" ? (
              <SheetClose
                aria-label={`Close ${title}`}
                className="absolute left-4 top-1/2 -translate-y-1/2 pt-1 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="size-5" />
              </SheetClose>
            ) : (
              <SheetClose
                aria-label={`Close ${title}`}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </SheetClose>
            )}
            <SheetTitle className="text-xl font-normal text-white">{title}</SheetTitle>
          </div>
        ) : (
          <SheetTitle className="sr-only">{title}</SheetTitle>
        )}

        {children}
      </SheetContent>
    </Sheet>
  );
}

