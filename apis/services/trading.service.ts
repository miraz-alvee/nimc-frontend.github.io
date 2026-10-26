import axiosApiInstance from "../apiAxiosInstance";
import type {
  TradingAsset,
  TradingTrendsResponse,
  PaginatedDealList,
  Deal,
  AssetChartResponse,
  TradeOrderRequest,
  DealCreated,
} from "../types/trading.types";

export const tradingService = {
  /**
   * GET /api/trading/assets/
   * Retrieve list of all available assets with payouts & prices
   */
  async getAssets(): Promise<TradingAsset[]> {
    const response = await axiosApiInstance.get<TradingAsset[]>("/api/trading/assets/");
    return response.data;
  },

  /**
   * GET /api/trading/assets/{id}/
   * Retrieve details for a specific asset by id
   */
  async getAssetById(id: number): Promise<TradingAsset> {
    const response = await axiosApiInstance.get<TradingAsset>(`/api/trading/assets/${id}/`);
    return response.data;
  },

  /**
   * GET /api/trading/assets/{id}/chart/
   * Retrieve historical chart points for a specific asset
   */
  async getAssetChart(id: number): Promise<AssetChartResponse> {
    const response = await axiosApiInstance.get<AssetChartResponse>(`/api/trading/assets/${id}/chart/`);
    return response.data;
  },

  /**
   * GET /api/trading/trends/
   * Retrieve market sentiments for selected and most traded assets
   */
  async getTrends(): Promise<TradingTrendsResponse> {
    const response = await axiosApiInstance.get<TradingTrendsResponse>("/api/trading/trends/");
    return response.data;
  },

  /**
   * GET /api/trading/deals/
   * Retrieve paginated history of user deals (requires authentication)
   */
  async getDeals(page = 1): Promise<PaginatedDealList> {
    const response = await axiosApiInstance.get<PaginatedDealList>("/api/trading/deals/", {
      params: { page },
    });
    return response.data;
  },

  /**
   * GET /api/trading/deals/{id}/
   * Retrieve single deal by id
   */
  async getDealById(id: number): Promise<Deal> {
    const response = await axiosApiInstance.get<Deal>(`/api/trading/deals/${id}/`);
    return response.data;
  },

  /**
   * POST /api/trading/buy/
   * Execute a BUY / UP trade order
   */
  async buy(payload: TradeOrderRequest): Promise<DealCreated> {
    const response = await axiosApiInstance.post<DealCreated>("/api/trading/buy/", payload);
    return response.data;
  },

  /**
   * POST /api/trading/sell/
   * Execute a SELL / DOWN trade order
   */
  async sell(payload: TradeOrderRequest): Promise<DealCreated> {
    const response = await axiosApiInstance.post<DealCreated>("/api/trading/sell/", payload);
    return response.data;
  },
};
