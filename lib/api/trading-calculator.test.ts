import { describe, it, expect } from "vitest";
import {
  calculateSetupFee,
  calculateTransactionTax,
  calculateTradeProfit,
  findBestTradingRoute,
  analyzeProfitability,
  getAllProfitableRoutes,
} from "./trading-calculator";

describe("Trading Calculator", () => {
  describe("calculateSetupFee", () => {
    it("should calculate 2.5% setup fee correctly", () => {
      expect(calculateSetupFee(1000)).toBe(25);
      expect(calculateSetupFee(10000)).toBe(250);
      expect(calculateSetupFee(100)).toBe(3); // 2.5 rounds up to 3
    });

    it("should handle edge cases", () => {
      expect(calculateSetupFee(0)).toBe(0);
      expect(calculateSetupFee(1)).toBe(1); // 0.025 rounds up to 1
    });
  });

  describe("calculateTransactionTax", () => {
    it("should calculate 8% tax for regular players", () => {
      expect(calculateTransactionTax(1000, false)).toBe(80);
      expect(calculateTransactionTax(10000, false)).toBe(800);
    });

    it("should calculate 4% tax for Premium players", () => {
      expect(calculateTransactionTax(1000, true)).toBe(40);
      expect(calculateTransactionTax(10000, true)).toBe(400);
    });

    it("should handle rounding correctly", () => {
      expect(calculateTransactionTax(100, false)).toBe(8);
      expect(calculateTransactionTax(100, true)).toBe(4);
    });
  });

  describe("calculateTradeProfit", () => {
    it("should calculate positive profit correctly", () => {
      // Buy at 1000, sell at 2000
      // Setup fee: 25 (2.5% of 1000)
      // Transaction tax: 160 (8% of 2000)
      // Total cost: 1025
      // Total revenue: 1840
      // Net profit: 815
      const result = calculateTradeProfit(1000, 2000, false);
      expect(result.setupFee).toBe(25);
      expect(result.transactionTax).toBe(160);
      expect(result.netProfit).toBe(815);
      expect(result.profitMargin).toBeCloseTo(79.51, 1);
    });

    it("should calculate negative profit (loss)", () => {
      // Buy at 2000, sell at 1000
      // Setup fee: 50 (2.5% of 2000)
      // Transaction tax: 80 (8% of 1000)
      // Total cost: 2050
      // Total revenue: 920
      // Net profit: -1130
      const result = calculateTradeProfit(2000, 1000, false);
      expect(result.netProfit).toBeLessThan(0);
      expect(result.profitMargin).toBeLessThan(0);
    });

    it("should calculate profit with Premium discount", () => {
      // Buy at 1000, sell at 2000 with Premium
      // Setup fee: 25 (2.5% of 1000)
      // Transaction tax: 80 (4% of 2000) - half the regular tax
      // Total cost: 1025
      // Total revenue: 1920
      // Net profit: 895
      const result = calculateTradeProfit(1000, 2000, true);
      expect(result.transactionTax).toBe(80);
      expect(result.netProfit).toBe(895);
      expect(result.isPremium).toBe(true);
    });
  });

  describe("findBestTradingRoute", () => {
    it("should find the most profitable route", () => {
      const cityPrices = [
        { city: "Bridgewatch", buyPrice: 1000 },
        { city: "Lymhurst", buyPrice: 1200 },
        { city: "Martlock", buyPrice: 900 },
      ];
      const blackMarketPrice = 2000;

      const result = findBestTradingRoute(cityPrices, blackMarketPrice, false);
      expect(result).not.toBeNull();
      expect(result?.buyCity).toBe("Martlock"); // Cheapest buy price
      expect(result?.netProfit).toBeGreaterThan(0);
    });

    it("should return null if no profitable routes", () => {
      const cityPrices = [
        { city: "Bridgewatch", buyPrice: 5000 },
        { city: "Lymhurst", buyPrice: 6000 },
      ];
      const blackMarketPrice = 1000; // Sell price too low

      const result = findBestTradingRoute(cityPrices, blackMarketPrice, false);
      expect(result).toBeNull();
    });

    it("should ignore zero or negative prices", () => {
      const cityPrices = [
        { city: "Bridgewatch", buyPrice: 0 },
        { city: "Lymhurst", buyPrice: 1000 },
      ];
      const blackMarketPrice = 2000;

      const result = findBestTradingRoute(cityPrices, blackMarketPrice, false);
      expect(result?.buyCity).toBe("Lymhurst");
    });
  });

  describe("analyzeProfitability", () => {
    it("should analyze item profitability correctly", () => {
      const cityPrices = [
        { city: "Bridgewatch", buyPrice: 1000 },
        { city: "Lymhurst", buyPrice: 1200 },
      ];

      const result = analyzeProfitability(
        "T4_BAG",
        "T4.0 Bag",
        1,
        cityPrices,
        2000,
        false
      );

      expect(result.itemId).toBe("T4_BAG");
      expect(result.bestBuyCity).toBe("Bridgewatch");
      expect(result.bestBuyPrice).toBe(1000);
      expect(result.blackMarketSellPrice).toBe(2000);
      expect(result.isProfitable).toBe(true);
      expect(result.profitPercentage).toBeGreaterThan(0);
    });

    it("should mark unprofitable items", () => {
      const cityPrices = [{ city: "Bridgewatch", buyPrice: 5000 }];

      const result = analyzeProfitability(
        "T4_BAG",
        "T4.0 Bag",
        1,
        cityPrices,
        1000,
        false
      );

      expect(result.isProfitable).toBe(false);
      expect(result.netProfit).toBeLessThan(0);
    });
  });

  describe("getAllProfitableRoutes", () => {
    it("should return all profitable routes sorted by profit", () => {
      const cityPrices = [
        { city: "Bridgewatch", buyPrice: 1000 },
        { city: "Lymhurst", buyPrice: 1200 },
        { city: "Martlock", buyPrice: 900 },
        { city: "Caerleon", buyPrice: 5000 }, // Not profitable
      ];
      const blackMarketPrice = 2000;

      const routes = getAllProfitableRoutes(cityPrices, blackMarketPrice, false);

      expect(routes.length).toBe(3); // Only profitable routes
      expect(routes[0].buyCity).toBe("Martlock"); // Highest profit (lowest buy price)
      expect(routes[0].netProfit).toBeGreaterThan(routes[1].netProfit);
      expect(routes[1].netProfit).toBeGreaterThan(routes[2].netProfit);
    });

    it("should return empty array if no profitable routes", () => {
      const cityPrices = [
        { city: "Bridgewatch", buyPrice: 5000 },
        { city: "Lymhurst", buyPrice: 6000 },
      ];
      const blackMarketPrice = 1000;

      const routes = getAllProfitableRoutes(cityPrices, blackMarketPrice, false);
      expect(routes.length).toBe(0);
    });
  });
});
