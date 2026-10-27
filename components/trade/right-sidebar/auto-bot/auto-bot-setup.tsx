"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type {
  AutoBot,
  DirectionEnum,
  TradeDirectionEnum,
  StrategyTypeEnum,
  TimeframeEnum,
} from "@/apis";
import { useTrading } from "@/components/trade/trading-context";
import { cn } from "@/lib/utils";

type FormRowProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function FormInputRow({ label, value, onChange }: FormRowProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm font-normal text-white">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-44 rounded-lg border border-[#005F78] bg-[#053345] px-3 text-sm text-white focus:border-[#00E5FF] focus:outline-none"
      />
    </div>
  );
}

type DropdownRowProps = {
  label: string;
  value: string;
  options: string[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (option: string) => void;
};

function FormDropdownRow({
  label,
  value,
  options,
  isOpen,
  onToggle,
  onSelect,
}: DropdownRowProps) {
  return (
    <div className="relative flex items-center justify-between gap-2">
      <span className="text-sm font-normal text-white">{label}</span>
      <button
        type="button"
        onClick={onToggle}
        className="flex h-9 w-44 items-center justify-between rounded-lg border border-[#005F78] bg-[#053345] px-3 text-xs text-white cursor-pointer hover:border-[#0092B8]"
      >
        <span>{value}</span>
        <ChevronDown className="size-4 text-white/70" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-10 z-20 w-44 rounded-lg border border-[#005F78] bg-[#053345] p-1 shadow-lg">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onSelect(opt)}
              className="w-full rounded px-2.5 py-1.5 text-left text-xs text-white hover:bg-white/10"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type Props = {
  bot?: AutoBot;
  onBack?: () => void;
};

// Enum mappings between UI labels and Swagger API schema
const TRADE_DIRECTION_MAP: Record<string, TradeDirectionEnum> = {
  "Buy & Sell": "buy_sell",
  "Buy Only": "buy",
  "Sell Only": "sell",
};
const TRADE_DIRECTION_REVERSE_MAP: Record<TradeDirectionEnum, string> = {
  buy_sell: "Buy & Sell",
  buy: "Buy Only",
  sell: "Sell Only",
};

const STRATEGY_TYPE_MAP: Record<string, StrategyTypeEnum> = {
  "Moving Average": "moving_average",
  "RSI Strategy": "rsi",
};
const STRATEGY_TYPE_REVERSE_MAP: Record<StrategyTypeEnum, string> = {
  moving_average: "Moving Average",
  rsi: "RSI Strategy",
};

const TIMEFRAME_MAP: Record<string, TimeframeEnum> = {
  "M1(1Min)": "M1",
  "M5(5Min)": "M5",
  "M15(15Min)": "M15",
  "M30(30Min)": "M30",
  "H1(1Hour)": "H1",
  "H4(4Hour)": "H4",
  "D1(1Day)": "D1",
};
const TIMEFRAME_REVERSE_MAP: Record<TimeframeEnum, string> = {
  M1: "M1(1Min)",
  M5: "M5(5Min)",
  M15: "M15(15Min)",
  M30: "M30(30Min)",
  H1: "H1(1Hour)",
  H4: "H4(4Hour)",
  D1: "D1(1Day)",
};

export function AutoBotSetup({ bot, onBack }: Props) {
  // Section 1: Trade & Position Sizing
  const [lotSize, setLotSize] = useState(bot?.lot_size || "0.10");
  const [investment, setInvestment] = useState(bot?.investment || "");
  const [autoCloseSeconds, setAutoCloseSeconds] = useState(
    String(bot?.auto_close_seconds || 30)
  );
  const [useDynamicRisk, setUseDynamicRisk] = useState(bot?.use_dynamic_risk ?? true);
  const [riskPerTrade, setRiskPerTrade] = useState(bot?.risk_per_trade_percent || "1.00");

  // Section 2: Strategy & Indicators
  const initialDirection = bot?.trade_direction
    ? TRADE_DIRECTION_REVERSE_MAP[bot.trade_direction] || "Buy & Sell"
    : "Buy & Sell";
  const [tradeDirection, setTradeDirection] = useState(initialDirection);
  const [isDirectionOpen, setIsDirectionOpen] = useState(false);

  const initialStrategy = bot?.strategy_type
    ? STRATEGY_TYPE_REVERSE_MAP[bot.strategy_type] || "Moving Average"
    : "Moving Average";
  const [strategyType, setStrategyType] = useState(initialStrategy);
  const [isStrategyOpen, setIsStrategyOpen] = useState(false);

  const [fastMA, setFastMA] = useState(bot?.fast_ma_period || "14.00");
  const [slowMA, setSlowMA] = useState(bot?.slow_ma_period || "28.00");
  const [rsiOverbought, setRsiOverbought] = useState(bot?.rsi_overbought || "70.00");
  const [rsiOversold, setRsiOversold] = useState(bot?.rsi_oversold || "30.00");

  const initialTimeframe = bot?.timeframe
    ? TIMEFRAME_REVERSE_MAP[bot.timeframe] || "H1(1Hour)"
    : "H1(1Hour)";
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);

  // Section 3: Risk Management
  const [stopLoss, setStopLoss] = useState(bot?.stop_loss_pips || "20.00");
  const [takeProfit, setTakeProfit] = useState(bot?.take_profit_pips || "40.00");
  const [trailingStop, setTrailingStop] = useState(bot?.trailing_stop_pips || "15.00");
  const [trailingStep, setTrailingStep] = useState(bot?.trailing_step_pips || "5.00");
  const [breakEvenTrigger, setBreakEvenTrigger] = useState(bot?.break_even_trigger || "10.00");

  const { botWs, selectedAsset } = useTrading();
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const parsedAutoClose = parseInt(autoCloseSeconds, 10);
      const autoCloseVal = !isNaN(parsedAutoClose)
        ? Math.min(86400, Math.max(5, parsedAutoClose))
        : 30;

      const tradeDir = TRADE_DIRECTION_MAP[tradeDirection] || "buy_sell";
      const dir: DirectionEnum = tradeDir === "sell" ? "sell" : "buy";
      const assetId = bot?.asset_id ?? selectedAsset?.id ?? undefined;

      await botWs.updateBot({
        asset_id: assetId,
        direction: dir,
        trade_direction: tradeDir,
        auto_close_seconds: autoCloseVal,
        lot_size: lotSize,
        ...(investment.trim() ? { investment: investment.trim() } : {}),
        use_dynamic_risk: useDynamicRisk,
        risk_per_trade_percent: riskPerTrade,
        strategy_type: STRATEGY_TYPE_MAP[strategyType] || "moving_average",
        fast_ma_period: fastMA,
        slow_ma_period: slowMA,
        rsi_overbought: rsiOverbought,
        rsi_oversold: rsiOversold,
        timeframe: TIMEFRAME_MAP[timeframe] || "H1",
        stop_loss_pips: stopLoss,
        take_profit_pips: takeProfit,
        trailing_stop_pips: trailingStop,
        trailing_step_pips: trailingStep,
        break_even_trigger: breakEvenTrigger,
      });
      onBack?.();
    } catch {
      // Toast error is handled inside botWs.updateBot
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-5 font-albert-sans overflow-y-auto">
      {/* Section 1: TRADE & POSITION SIZING */}
      <div>
        <h3 className="mb-2 text-[11px] font-semibold tracking-wider text-white/70 uppercase">
          TRADE &amp; POSITION SIZING
        </h3>
        <div className="rounded-xl border border-[#005F78] bg-[#104E64] p-2 space-y-3">
          <FormInputRow label="Lot Size" value={lotSize} onChange={setLotSize} />
          <FormInputRow label="Investment ($)" value={investment} onChange={setInvestment} />
          <FormInputRow
            label="Auto-Close (sec)"
            value={autoCloseSeconds}
            onChange={setAutoCloseSeconds}
          />

          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-normal text-white">Use Dynamic Risk</span>
            <button
              type="button"
              role="switch"
              aria-checked={useDynamicRisk}
              onClick={() => setUseDynamicRisk(!useDynamicRisk)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer border border-[#0092B8]/30",
                useDynamicRisk ? "bg-[#0092B8]" : "bg-[#005F78]"
              )}
            >
              <span
                className={cn(
                  "inline-block size-5 rounded-full bg-[#021f2d] shadow-sm transition-transform duration-200 ease-in-out",
                  useDynamicRisk ? "translate-x-5.5 bg-[#032331]" : "translate-x-0.5"
                )}
              />
            </button>
          </div>

          <FormInputRow
            label="Risk Per Trade (%)"
            value={riskPerTrade}
            onChange={setRiskPerTrade}
          />
        </div>
      </div>

      {/* Section 2: STRATEGY & INDICATORS */}
      <div>
        <h3 className="px-1 mb-2 text-[11px] font-semibold tracking-wider text-white/70 uppercase">
          STRATEGY &amp; INDICATORS
        </h3>
        <div className="rounded-xl border border-[#005F78] bg-[#104E64] p-2 space-y-3">
          <FormDropdownRow
            label="Trade Direction"
            value={tradeDirection}
            options={["Buy & Sell", "Buy Only", "Sell Only"]}
            isOpen={isDirectionOpen}
            onToggle={() => {
              setIsDirectionOpen(!isDirectionOpen);
              setIsStrategyOpen(false);
              setIsTimeframeOpen(false);
            }}
            onSelect={(val) => {
              setTradeDirection(val);
              setIsDirectionOpen(false);
            }}
          />

          <FormDropdownRow
            label="Strategy Type"
            value={strategyType}
            options={["Moving Average", "RSI Strategy"]}
            isOpen={isStrategyOpen}
            onToggle={() => {
              setIsStrategyOpen(!isStrategyOpen);
              setIsDirectionOpen(false);
              setIsTimeframeOpen(false);
            }}
            onSelect={(val) => {
              setStrategyType(val);
              setIsStrategyOpen(false);
            }}
          />

          <FormInputRow label="Fast MA Period" value={fastMA} onChange={setFastMA} />
          <FormInputRow label="Slow MA Period" value={slowMA} onChange={setSlowMA} />
          <FormInputRow
            label="RSI Overbought"
            value={rsiOverbought}
            onChange={setRsiOverbought}
          />
          <FormInputRow
            label="RSI Oversold"
            value={rsiOversold}
            onChange={setRsiOversold}
          />

          <FormDropdownRow
            label="Timeframe"
            value={timeframe}
            options={[
              "M1(1Min)",
              "M5(5Min)",
              "M15(15Min)",
              "M30(30Min)",
              "H1(1Hour)",
              "H4(4Hour)",
              "D1(1Day)",
            ]}
            isOpen={isTimeframeOpen}
            onToggle={() => {
              setIsTimeframeOpen(!isTimeframeOpen);
              setIsDirectionOpen(false);
              setIsStrategyOpen(false);
            }}
            onSelect={(val) => {
              setTimeframe(val);
              setIsTimeframeOpen(false);
            }}
          />
        </div>
      </div>

      {/* Section 3: RISK MANAGEMENT */}
      <div>
        <h3 className="px-1 mb-2 text-[11px] font-semibold tracking-wider text-white/70 uppercase">
          RISK MANAGEMENT
        </h3>
        <div className="rounded-xl border border-[#005F78] bg-[#104E64] p-2 space-y-3">
          <FormInputRow
            label="Stop Loss (pips)"
            value={stopLoss}
            onChange={setStopLoss}
          />
          <FormInputRow
            label="Take Profit (pips)"
            value={takeProfit}
            onChange={setTakeProfit}
          />
          <FormInputRow
            label="Trailing Stop (pips)"
            value={trailingStop}
            onChange={setTrailingStop}
          />
          <FormInputRow
            label="Trailing Step (pips)"
            value={trailingStep}
            onChange={setTrailingStep}
          />
          <FormInputRow
            label="Break-Even Trigger (pips)"
            value={breakEvenTrigger}
            onChange={setBreakEvenTrigger}
          />
        </div>
      </div>

      <div className="flex justify-end items-center gap-3 pt-3">
        {/* Cancel Button */}
        <button
          type="button"
          onClick={onBack}
          disabled={isSaving || botWs.isUpdating}
          className="cursor-pointer w-full px-4 py-3 text-base font-medium text-white bg-[#104E64] border border-[#005F78] rounded-xl hover:bg-[#14617d] transition-colors disabled:opacity-60"
        >
          Cancel
        </button>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSaving || botWs.isUpdating}
          className="cursor-pointer w-full px-4 py-3 text-base font-medium text-black bg-[#00B8DB] border border-[#005F78] rounded-xl hover:bg-[#00d0f7] transition-colors shadow-sm disabled:opacity-60"
        >
          {isSaving || botWs.isUpdating ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
