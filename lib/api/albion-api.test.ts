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
  getCityPricesSorted,
  getValidCities,
  PriceData,
} from "./albion-api";

// Mock fetch
global.fetch = vi.fn();

describe("Albion API Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("formatDateForAPI", () => {
    it("should format date correctly as DD-MM-YYYY", () => {
      const date = new Date("2026-01-15T00:00:00Z");
      expect(formatDateForAPI(date)).toBe("15-01-2026");
    });

    it("should pad single digit days and months", () => {
      const date = new Date("2026-01-05T00:00:00Z");
      expect(formatDateForAPI(date)).toBe("05-01-2026");
    });
  });

  describe("getDateRange", () => {
    it("should return correct date range for specified days", () => {
      const startDate = new Date("2026-01-01T00:00:00Z");
      const endDate = new Date("2026-01-08T00:00:00Z");
      const range = getDateRange(startDate, endDate);
      expect(range.date).toBeDefined();
      expect(range.end_date).toBeDefined();
      expect(range["time-scale"]).toBe("24");
    });

    it("should calculate dates correctly", () => {
      const startDate = new Date("2026-01-01T00:00:00Z");
      const endDate = new Date("2026-01-08T00:00:00Z");
      const range = getDateRange(startDate, endDate);
      expect(range.date).toBe("01-01-2026");
      expect(range.end_date).toBe("08-01-2026");
    });
  });

  describe("parseItemId", () => {
    it("should parse item ID correctly", () => {
      const result = parseItemId("T4_BAG");
      expect(result.tier).toBe(4);
      expect(result.name).toBe("BAG");
    });

    it("should handle multi-word item names", () => {
      const result = parseItemId("T5_ARMOR_PLATE");
      expect(result.tier).toBe(5);
      expect(result.name).toBe("ARMOR PLATE");
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
          city: "Bridgewatch",
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
          city: "Lymhurst",
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
      expect(result.bestSell.price).toBe(4500);
      expect(result.bestBuy.price).toBeGreaterThan(0);
    });

    it("should handle empty price list", () => {
      const result = findBestPrices([]);
      expect(result.bestBuy.price).toBe(Infinity);
      expect(result.bestSell.price).toBe(0);
    });
  });

  describe("getAveragePrice", () => {
    it("should calculate average price correctly", () => {
      const prices: PriceData[] = [
        {
          item_id: "T4_BAG",
          city: "Bridgewatch",
          quality: 1,
          sell_price_min: 4500,
          sell_price_min_date: "2026-01-07T10:10:00",
          sell_price_max: 4599,
          sell_price_max_date: "2026-01-07T10:10:00",
          buy_price_min: 2370,
          buy_price_min_date: "2026-01-07T10:10:00",
          buy_price_max: 2000,
          buy_price_max_date: "2026-01-07T10:10:00",
        },
        {
          item_id: "T4_BAG",
          city: "Lymhurst",
          quality: 1,
          sell_price_min: 4400,
          sell_price_min_date: "2026-01-07T19:35:00",
          sell_price_max: 4400,
          sell_price_max_date: "2026-01-07T19:35:00",
          buy_price_min: 102,
          buy_price_min_date: "2026-01-07T16:35:00",
          buy_price_max: 2000,
          buy_price_max_date: "2026-01-07T16:35:00",
        },
      ];

      const avg = getAveragePrice(prices);
      expect(avg).toBe(2000);
    });

    it("should return 0 for empty list", () => {
      expect(getAveragePrice([])).toBe(0);
    });
  });

  describe("calculateProfit", () => {
    it("should calculate profit correctly", () => {
      expect(calculateProfit(1000, 1500)).toBe(500);
      expect(calculateProfit(2000, 1000)).toBe(-1000);
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

  describe("getCityPricesSorted", () => {
    it("should return city prices sorted by buy price", () => {
      const prices: PriceData[] = [
        {
          item_id: "T4_BAG",
          city: "Lymhurst",
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
        {
          item_id: "T4_BAG",
          city: "Bridgewatch",
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

      const sorted = getCityPricesSorted(prices);
      expect(sorted[0].buyPrice).toBeLessThanOrEqual(sorted[1].buyPrice);
      expect(sorted[0].city).toBe("Bridgewatch");
    });

    it("should exclude Black Market from results", () => {
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

      const sorted = getCityPricesSorted(prices);
      expect(sorted.length).toBe(1);
      expect(sorted[0].city).toBe("Bridgewatch");
    });
  });

  describe("getValidCities", () => {
    it("should return list of valid trading cities", () => {
      const cities = getValidCities();
      expect(cities).toContain("Bridgewatch");
      expect(cities).toContain("Caerleon");
      expect(cities).toContain("Lymhurst");
      expect(cities).not.toContain("Black Market");
    });
  });
});
