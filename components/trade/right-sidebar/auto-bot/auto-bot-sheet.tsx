import { useState } from "react";
import { ArrowLeft, Settings, X } from "lucide-react";
import toast from "react-hot-toast";
import { SheetClose } from "@/components/ui/sheet";
import { SideSheet, type SheetProps } from "@/components/shared/side-sheet";
import { useAuth, useBotQuery, formatApiError } from "@/apis";
import { useTrading } from "@/components/trade/trading-context";
import { AutoBotMain } from "./auto-bot-main";
import { AutoBotSetup } from "./auto-bot-setup";

export function AutoBotSheet(props: SheetProps) {
  const [view, setView] = useState<"main" | "setup">("main");
  const { isAuthenticated } = useAuth();
  const { selectedAsset, botWs } = useTrading();

  // Fallback to React Query if botWs hasn't fetched bot object yet
  const { data: botQueryData, isLoading: isBotLoading } = useBotQuery({
    enabled: props.open && isAuthenticated && !botWs.bot,
  });

  const bot = botWs.bot || botQueryData;
  const isBotActive = Boolean(bot?.is_enabled);

  const handleToggleActive = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to use Auto Bot");
      return;
    }

    if (!isBotActive) {
      // Activating Auto Bot
      const assetId = bot?.asset_id ?? selectedAsset?.id;
      if (assetId == null) {
        toast.error("Select a trading asset before activating Auto Bot");
        return;
      }
      try {
        await botWs.startBot({ asset_id: assetId });
      } catch (err) {
        toast.error(formatApiError(err));
      }
    } else {
      // Deactivating Auto Bot
      try {
        await botWs.stopBot();
      } catch (err) {
        toast.error(formatApiError(err));
      }
    }
  };

  const handleExecuteCycle = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to execute Auto Bot");
      return;
    }

    try {
      await botWs.executeCycle();
    } catch (err) {
      toast.error(formatApiError(err));
    }
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
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-normal text-white">Auto Bot</h2>
            {isAuthenticated && (
              <span
                title={botWs.isConnected ? "WebSocket Live Connected" : "WebSocket Disconnected"}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  botWs.isConnected
                    ? "bg-[#00E676]/15 text-[#00E676] border-[#00E676]/30"
                    : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    botWs.isConnected ? "bg-[#00E676] animate-pulse" : "bg-amber-400"
                  }`}
                />
                {botWs.isConnected ? "Live WS" : "Offline"}
              </span>
            )}
          </div>
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
          isActive={isBotActive}
          onToggleActive={handleToggleActive}
          onExecute={handleExecuteCycle}
          isLoading={isBotLoading && !bot}
          isToggling={botWs.isStarting || botWs.isStopping}
          isExecuting={botWs.isExecuting}
          isAuthenticated={isAuthenticated}
          isWsConnected={botWs.isConnected}
          bot={bot}
          lastDecision={botWs.lastDecision}
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
