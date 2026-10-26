/**
 * Trading API Types
 * Corresponds to /api/trading/ and /ws/market/ endpoints
 */

export interface TradingAsset {
  id: number;
  symbol: string;
  name: string;
  display_name: string;
  mt5_symbol?: string;
  is_otc: boolean;
  payout_percent: string;
  price?: string | number | null;
  bid?: string;
  ask?: string;
}

export type TrendSentiment = "buy" | "sell" | "neutral";

export interface TrendAsset {
  id: number;
  symbol: string;
  name: string;
  display_name: string;
  is_otc: boolean;
  sentiment: TrendSentiment;
}

export interface TradingTrendsResponse {
  selected: TrendAsset | null;
  most_traded: TrendAsset[];
}

export type DealDirection = "buy" | "sell";
export type DealStatus = "open" | "won" | "lost" | "refunded";

export interface Deal {
  id: number;
  symbol: string;
  display_name: string;
  direction: DealDirection;
  broker: string;
  broker_symbol: string;
  broker_ticket: number | null;
  volume: string | null;
  investment: string;
  payout_percent: string;
  entry_price: string;
  exit_price: string | null;
  profit: string | null;
  status: DealStatus;
  auto_close_seconds: number;
  seconds_remaining: number;
  opened_at: string;
  closes_at: string;
}

export interface PaginatedDealList {
  count: number;
  next: string | null;
  previous: string | null;
  results: Deal[];
}

export interface ChartPoint {
  price: string | number;
  recorded_at: number; // Unix epoch seconds
  label?: string;
}

export interface AssetChartResponse {
  asset?: TradingAsset;
  points: ChartPoint[];
  source?: string;
}

export interface TradeOrderRequest {
  asset_id: number;
  symbol: string;
  investment: string;
  auto_close_seconds: number;
  volume?: string;
}

export interface DealCreated {
  deal: Deal;
  available_balance: string | null;
  currency: string | null;
  broker: string;
}

export interface MarketQuote {
  id: number;
  symbol: string;
  display_name: string;
  bid: string;
  ask: string;
  price: string;
  time: number | null;
  source: string;
}

export type MarketWsMessage =
  | {
      type: "quotes";
      quotes: MarketQuote[];
    }
  | {
      type: "chart";
      asset_id: number;
      source: string;
      points: ChartPoint[];
    }
  | {
      type: "trends";
      selected: TrendAsset | null;
      most_traded: TrendAsset[];
    };
