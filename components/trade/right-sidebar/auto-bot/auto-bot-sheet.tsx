import { useState } from "react";
import { ArrowLeft, Settings, X } from "lucide-react";
import toast from "react-hot-toast";
import { SheetClose } from "@/components/ui/sheet";
import { SideSheet, type SheetProps } from "@/components/shared/side-sheet";
import {
  useAuth,
  useBotQuery,
  useUpdateBotMutation,
  useExecuteBotMutation,
  formatApiError,
} from "@/apis";
import { AutoBotMain } from "./auto-bot-main";
import { AutoBotSetup } from "./auto-bot-setup";

export function AutoBotSheet(props: SheetProps) {
  const [view, setView] = useState<"main" | "setup">("main");
  const { isAuthenticated } = useAuth();

  const { data: bot, isLoading } = useBotQuery({
    enabled: props.open && isAuthenticated,
  });

  const updateBotMutation = useUpdateBotMutation();
  const executeBotMutation = useExecuteBotMutation();

  const handleToggleActive = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to use Auto Bot");
      return;
    }

    const nextState = !bot?.is_enabled;
    updateBotMutation.mutate(
      { is_enabled: nextState },
      {
        onSuccess: () => {
          toast.success(nextState ? "Auto Bot activated!" : "Auto Bot deactivated!");
        },
        onError: (err) => {
          toast.error(formatApiError(err));
        },
      }
    );
  };

  const handleExecuteCycle = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to execute Auto Bot");
      return;
    }

    executeBotMutation.mutate(undefined, {
      onSuccess: (res) => {
        const msg = res?.message || res?.detail || "Auto Bot cycle executed successfully!";
        toast.success(msg);
      },
      onError: (err) => {
        toast.error(formatApiError(err));
      },
    });
  };

  return (
    <SideSheet
      {...props}
      side="right"
      title={view === "main" ? "Auto Bot" : "Auto Bot Setup"}
      showHeader={false}
    >
      {/* Header */}
      {view === "main" ? (
        <div className="sticky top-0 z-10 bg-[#053345] flex items-center justify-between px-5 pt-6 pb-4 border-b border-[#0092B8]/40 shrink-0 font-albert-sans">
          <SheetClose
            aria-label="Close Auto Bot"
            className="text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </SheetClose>
          <h2 className="text-xl font-normal text-white">Auto Bot</h2>
          <button
            type="button"
            aria-label="Open Auto Bot Setup"
            onClick={() => setView("setup")}
            className="text-white/80 hover:text-[#00E5FF] transition-colors cursor-pointer"
          >
            <Settings className="size-5" />
          </button>
        </div>
      ) : (
        <div className="sticky top-0 z-10 bg-[#053345] flex items-center justify-center px-5 pt-6 pb-4 border-b border-[#0092B8]/40 shrink-0 font-albert-sans">
          <button
            type="button"
            aria-label="Back to Auto Bot"
            onClick={() => setView("main")}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h2 className="text-xl font-normal text-white">Auto Bot Setup</h2>
        </div>
      )}

      {/* Content */}
      {view === "main" ? (
        <AutoBotMain
          isActive={Boolean(bot?.is_enabled)}
          onToggleActive={handleToggleActive}
          onExecute={handleExecuteCycle}
          isLoading={isLoading}
          isToggling={updateBotMutation.isPending}
          isExecuting={executeBotMutation.isPending}
          isAuthenticated={isAuthenticated}
          bot={bot}
        />
      ) : (
        <AutoBotSetup
          key={bot ? `bot-${bot.strategy_type}-${bot.trade_direction}-${bot.is_enabled}` : "bot-empty"}
          bot={bot}
          onBack={() => setView("main")}
        />
      )}
    </SideSheet>
  );
}
