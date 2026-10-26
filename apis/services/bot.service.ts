import axiosApiInstance from "../apiAxiosInstance";
import type { AutoBot, PatchedAutoBotRequest, ExecuteBotResponse } from "../types/bot.types";

export const botService = {
  /**
   * GET /api/bots/
   * Retrieve auto bot configuration and runtime status
   */
  async getBot(): Promise<AutoBot> {
    const response = await axiosApiInstance.get<AutoBot>("/api/bots/");
    return response.data;
  },

  /**
   * PATCH /api/bots/
   * Partially update auto bot configuration or toggle active state
   */
  async updateBot(payload: PatchedAutoBotRequest): Promise<AutoBot> {
    const response = await axiosApiInstance.patch<AutoBot>("/api/bots/", payload);
    return response.data;
  },

  /**
   * POST /api/bots/execute/
   * Trigger immediate bot execution
   */
  async executeBot(): Promise<ExecuteBotResponse> {
    const response = await axiosApiInstance.post<ExecuteBotResponse>("/api/bots/execute/", {});
    return response.data;
  },
};
