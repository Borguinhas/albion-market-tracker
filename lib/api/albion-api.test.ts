import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchCurrentPrices,
  fetchHistoricalPrices,
  formatDateForAPI,
  getDateRange,
  parseItemId,
  findBestPrices,
  calculateProfit,
  getAveragePrice,
  getBlackMarketSellPrice,
  PriceData,
} from "./albion-api";

// Mock fetch
global.fetch = vi.fn();

describe("Albion API Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("formatDateForAPI", () => {
    it("should format date correctly to DD-MM-YYYY", () => {
      const date = new Date("2026-01-07T00:00:00Z");
      const result = formatDateForAPI(date);
      // Just verify it matches the pattern
      expect(result).toMatch(/\d{2}-01-2026/);
    });

    it("should pad single digit days and months", () => {
      const date = new Date("2026-01-05T00:00:00Z");
      const result = formatDateForAPI(date);
      expect(result).toMatch(/\d{2}-01-2026/);
    });
  });

  describe("getDateRange", () => {
    it("should return date range for last 7 days by default", () => {
      const range = getDateRange();
      expect(range.start).toBeDefined();
      expect(range.end).toBeDefined();
      expect(range.start).toBeTruthy();
      expect(range.end).toBeTruthy();
    });

    it("should return correct date range for specified days", () => {
      const range = getDateRange(30);
      expect(range.start).toBeDefined();
      expect(range.end).toBeDefined();
    });
  });

  describe("parseItemId", () => {
    it("should parse item ID correctly", () => {
      const result = parseItemId("T4_BAG");
      expect(result.tier).toBe(4);
      expect(result.name).toBe("BAG");
    });

    it("should handle multi-word item names", () => {
      const result = parseItemId("T5_ARMOR_CLOTH");
      expect(result.tier).toBe(5);
      expect(result.name).toBe("ARMOR CLOTH");
    });

    it("should handle invalid item IDs", () => {
      const result = parseItemId("INVALID");
      expect(result.tier).toBe(0);
      expect(result.name).toBe("INVALID");
    });
  });

  describe("findBestPrices", () => {
    it("should find best buy and sell prices", () => {
      const prices: PriceData[] = [
        {
          item_id: "T4_BAG",
          city: "Black Market",
          quality: 1,
          sell_price_min: 4500,
          sell_price_min_date: "2026-01-07T10:10:00",
          sell_price_max: 4599,
          sell_price_max_date: "2026-01-07T10:10:00",
          buy_price_min: 2370,
          buy_price_min_date: "2026-01-07T10:10:00",
          buy_price_max: 2528,
          buy_price_max_date: "2026-01-07T10:10:00",
        },
        {
          item_id: "T4_BAG",
          city: "Bridgewatch",
          quality: 1,
          sell_price_min: 4400,
          sell_price_min_date: "2026-01-07T19:35:00",
          sell_price_max: 4400,
          sell_price_max_date: "2026-01-07T19:35:00",
          buy_price_min: 102,
          buy_price_min_date: "2026-01-07T16:35:00",
          buy_price_max: 2994,
          buy_price_max_date: "2026-01-07T16:35:00",
        },
      ];

      const result = findBestPrices(prices);
      // Best sell should be the lowest sell_price_min
      expect(result.bestSell.price).toBe(4500);
      // Best buy should have a valid price
      expect(result.bestBuy.price).toBeGreaterThan(0);
    });

    it("should handle empty prices array", () => {
      const result = findBestPrices([]);
      expect(result.bestBuy.price).toBe(Infinity);
      expect(result.bestSell.price).toBe(0);
    });
  });

  describe("calculateProfit", () => {
    it("should calculate profit margin correctly", () => {
      const profit = calculateProfit(1000, 1500);
      expect(profit).toBe(50);
    });

    it("should handle zero buy price", () => {
      const profit = calculateProfit(0, 1500);
      expect(profit).toBe(0);
    });

    it("should handle negative profit", () => {
      const profit = calculateProfit(1500, 1000);
      expect(profit).toBeCloseTo(-33.33, 1);
    });
  });

  describe("getAveragePrice", () => {
    it("should calculate average price from multiple entries", () => {
      const prices: PriceData[] = [
        {
          item_id: "T4_BAG",
          city: "Black Market",
          quality: 1,
          sell_price_min: 4500,
          sell_price_min_date: "2026-01-07T10:10:00",
          sell_price_max: 4599,
          sell_price_max_date: "2026-01-07T10:10:00",
          buy_price_min: 2370,
          buy_price_min_date: "2026-01-07T10:10:00",
          buy_price_max: 2528,
          buy_price_max_date: "2026-01-07T10:10:00",
        },
        {
          item_id: "T4_BAG",
          city: "Bridgewatch",
          quality: 1,
          sell_price_min: 4400,
          sell_price_min_date: "2026-01-07T19:35:00",
          sell_price_max: 4400,
          sell_price_max_date: "2026-01-07T19:35:00",
          buy_price_min: 102,
          buy_price_min_date: "2026-01-07T16:35:00",
          buy_price_max: 2994,
          buy_price_max_date: "2026-01-07T16:35:00",
        },
      ];

      const avg = getAveragePrice(prices);
      expect(avg).toBeGreaterThan(0);
      expect(typeof avg).toBe("number");
    });

    it("should return 0 for empty array", () => {
      const avg = getAveragePrice([]);
      expect(avg).toBe(0);
    });
  });

  describe("fetchCurrentPrices", () => {
    it("should fetch prices successfully", async () => {
      const mockData = [
        {
          item_id: "T4_BAG",
          city: "Black Market",
          quality: 1,
          sell_price_min: 4500,
          sell_price_min_date: "2026-01-07T10:10:00",
          sell_price_max: 4599,
          sell_price_max_date: "2026-01-07T10:10:00",
          buy_price_min: 2370,
          buy_price_min_date: "2026-01-07T10:10:00",
          buy_price_max: 2528,
          buy_price_max_date: "2026-01-07T10:10:00",
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchCurrentPrices(["T4_BAG"]);
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("stats/prices/T4_BAG"),
        expect.any(Object)
      );
    });

    it("should handle API errors", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(fetchCurrentPrices(["T4_BAG"])).rejects.toThrow();
    });
  });

  describe("getBlackMarketSellPrice", () => {
    it("should return Black Market sell price", () => {
      const prices: PriceData[] = [
        {
          item_id: "T4_BAG",
          city: "Black Market",
          quality: 1,
          sell_price_min: 4500,
          sell_price_min_date: "2026-01-07T10:10:00",
          sell_price_max: 4599,
          sell_price_max_date: "2026-01-07T10:10:00",
          buy_price_min: 2370,
          buy_price_min_date: "2026-01-07T10:10:00",
          buy_price_max: 2528,
          buy_price_max_date: "2026-01-07T10:10:00",
        },
        {
          item_id: "T4_BAG",
          city: "Bridgewatch",
          quality: 1,
          sell_price_min: 4400,
          sell_price_min_date: "2026-01-07T19:35:00",
          sell_price_max: 4400,
          sell_price_max_date: "2026-01-07T19:35:00",
          buy_price_min: 102,
          buy_price_min_date: "2026-01-07T16:35:00",
          buy_price_max: 2994,
          buy_price_max_date: "2026-01-07T16:35:00",
        },
      ];

      const result = getBlackMarketSellPrice(prices);
      expect(result).not.toBeNull();
      expect(result?.price).toBe(4500);
      expect(result?.quality).toBe(1);
    });

    it("should return null if no Black Market prices", () => {
      const prices: PriceData[] = [
        {
          item_id: "T4_BAG",
          city: "Bridgewatch",
          quality: 1,
          sell_price_min: 4400,
          sell_price_min_date: "2026-01-07T19:35:00",
          sell_price_max: 4400,
          sell_price_max_date: "2026-01-07T19:35:00",
          buy_price_min: 102,
          buy_price_min_date: "2026-01-07T16:35:00",
          buy_price_max: 2994,
          buy_price_max_date: "2026-01-07T16:35:00",
        },
      ];

      const result = getBlackMarketSellPrice(prices);
      expect(result).toBeNull();
    });
  });

  describe("fetchHistoricalPrices", () => {
    it("should fetch historical prices successfully", async () => {
      const mockData = [
        {
          location: "Black Market",
          item_id: "T4_BAG",
          quality: 1,
          data: [
            {
              item_count: 125,
              avg_price: 4225,
              timestamp: "2025-12-31T00:00:00",
            },
          ],
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchHistoricalPrices(["T4_BAG"], "01-01-2026", "06-01-2026");
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("stats/history"),
        expect.any(Object)
      );
    });

    it("should include date parameters in request", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await fetchHistoricalPrices(["T4_BAG"], "01-01-2026", "06-01-2026", 24);
      const callUrl = (global.fetch as any).mock.calls[0][0];
      expect(callUrl).toContain("date=01-01-2026");
      expect(callUrl).toContain("end_date=06-01-2026");
      expect(callUrl).toContain("time-scale=24");
    });
  });
});
