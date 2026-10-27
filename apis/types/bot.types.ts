export type DirectionEnum = "buy" | "sell";
export type TradeDirectionEnum = "buy" | "sell" | "buy_sell";
export type StrategyTypeEnum = "moving_average" | "rsi";
export type TimeframeEnum = "M1" | "M5" | "M15" | "M30" | "H1" | "H4" | "D1";

export interface AutoBot {
  status: string;
  is_enabled: boolean;
  direction?: DirectionEnum;
  trade_direction?: TradeDirectionEnum;
  investment?: string;
  auto_close_seconds?: number;
  asset_id?: number | null;
  symbol?: string;
  display_name?: string;
  lot_size?: string;
  use_dynamic_risk?: boolean;
  risk_per_trade_percent?: string;
  strategy_type?: StrategyTypeEnum;
  fast_ma_period?: string;
  slow_ma_period?: string;
  rsi_overbought?: string;
  rsi_oversold?: string;
  timeframe?: TimeframeEnum;
  stop_loss_pips?: string;
  take_profit_pips?: string;
  trailing_stop_pips?: string;
  trailing_step_pips?: string;
  break_even_trigger?: string;
  last_action?: string;
  last_reason?: string;
  last_decided_at?: string | null;
}

export interface PatchedAutoBotRequest {
  is_enabled?: boolean;
  direction?: DirectionEnum;
  trade_direction?: TradeDirectionEnum;
  investment?: string;
  auto_close_seconds?: number;
  asset_id?: number | null;
  lot_size?: string;
  use_dynamic_risk?: boolean;
  risk_per_trade_percent?: string;
  strategy_type?: StrategyTypeEnum;
  fast_ma_period?: string;
  slow_ma_period?: string;
  rsi_overbought?: string;
  rsi_oversold?: string;
  timeframe?: TimeframeEnum;
  stop_loss_pips?: string;
  take_profit_pips?: string;
  trailing_stop_pips?: string;
  trailing_step_pips?: string;
  break_even_trigger?: string;
}

export interface ExecuteBotResponse {
  message?: string;
  detail?: string;
  status?: string;
  [key: string]: unknown;
}

export interface BotDecision {
  action: "buy" | "sell" | "hold" | string;
  reason: string;
}

export interface BotWsMessage {
  type: "bot" | "error" | string;
  bot?: AutoBot;
  decision?: BotDecision;
  deal?: import("./trading.types").Deal | null;
  available_balance?: string;
  currency?: string;
  detail?: string;
  message?: string;
}

export type BotWsAction =
  | { action: "auth"; token: string }
  | { action: "status" }
  | { action: "start" }
  | { action: "stop" }
  | { action: "execute" }
  | { action: "update"; bot: PatchedAutoBotRequest };

