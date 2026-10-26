import { cn } from "@/lib/utils";

export function Panel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#0092B8] bg-[#00B8DB1A] backdrop-blur",
        className
      )}
      {...props}
    />
  );
}
