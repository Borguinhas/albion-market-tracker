/**
 * Trading Calculator for Albion Online Marketplace
 * Calculates profit margins when buying from cities and selling to Black Market
 *
 * Marketplace Fees:
 * - Setup Fee: 2.5% (paid when placing order)
 * - Transaction Tax: 8% (paid when selling) or 4% with Premium
 */

export interface TradingRoute {
  buyCity: string;
  buyPrice: number;
  sellPrice: number;
  setupFee: number;
  transactionTax: number;
  netProfit: number;
  profitMargin: number; // percentage
  isPremium: boolean;
}

export interface ProfitCalculation {
  itemId: string;
  itemName: string;
  quality: number;
  bestBuyCity: string;
  bestBuyPrice: number;
  blackMarketSellPrice: number;
  setupFee: number;
  transactionTax: number;
  netProfit: number;
  profitPercentage: number;
  isProfitable: boolean;
  isPremium: boolean;
}

/**
 * Calculate setup fee (2.5% of price)
 */
export function calculateSetupFee(price: number): number {
  return Math.ceil(price * 0.025);
}

/**
 * Calculate transaction tax (8% or 4% with Premium)
 */
export function calculateTransactionTax(price: number, isPremium: boolean = false): number {
  const taxRate = isPremium ? 0.04 : 0.08;
  return Math.ceil(price * taxRate);
}

/**
 * Calculate net profit for a trading route
 * Buy from city at buyPrice, sell to Black Market at sellPrice
 */
export function calculateTradeProfit(
  buyPrice: number,
  sellPrice: number,
  isPremium: boolean = false
): TradingRoute {
  const setupFee = calculateSetupFee(buyPrice);
  const transactionTax = calculateTransactionTax(sellPrice, isPremium);

  const totalCost = buyPrice + setupFee;
  const totalRevenue = sellPrice - transactionTax;
  const netProfit = totalRevenue - totalCost;
  const profitMargin = (netProfit / totalCost) * 100;

  return {
    buyCity: "",
    buyPrice,
    sellPrice,
    setupFee,
    transactionTax,
    netProfit,
    profitMargin,
    isPremium,
  };
}

/**
 * Find the best trading route from all available cities
 * Returns the city with the lowest buy price that has positive profit
 */
export function findBestTradingRoute(
  cityPrices: Array<{ city: string; buyPrice: number }>,
  blackMarketSellPrice: number,
  isPremium: boolean = false
): TradingRoute | null {
  let bestRoute: TradingRoute | null = null;
  let bestProfit = -Infinity;

  for (const { city, buyPrice } of cityPrices) {
    if (buyPrice <= 0) continue;

    const route = calculateTradeProfit(buyPrice, blackMarketSellPrice, isPremium);
    route.buyCity = city;

    // Prefer routes with highest profit
    if (route.netProfit > bestProfit) {
      bestProfit = route.netProfit;
      bestRoute = route;
    }
  }

  // Only return if profitable
  return bestRoute && bestRoute.netProfit > 0 ? bestRoute : null;
}

/**
 * Calculate complete profit analysis for an item
 */
export function analyzeProfitability(
  itemId: string,
  itemName: string,
  quality: number,
  cityPrices: Array<{ city: string; buyPrice: number }>,
  blackMarketSellPrice: number,
  isPremium: boolean = false
): ProfitCalculation {
  // Find cheapest city to buy from
  const validPrices = cityPrices.filter((p) => p.buyPrice > 0);
  const bestBuyCity = validPrices.reduce((best, current) =>
    current.buyPrice < best.buyPrice ? current : best
  );

  const setupFee = calculateSetupFee(bestBuyCity.buyPrice);
  const transactionTax = calculateTransactionTax(blackMarketSellPrice, isPremium);

  const totalCost = bestBuyCity.buyPrice + setupFee;
  const totalRevenue = blackMarketSellPrice - transactionTax;
  const netProfit = totalRevenue - totalCost;
  const profitPercentage = (netProfit / totalCost) * 100;

  return {
    itemId,
    itemName,
    quality,
    bestBuyCity: bestBuyCity.city,
    bestBuyPrice: bestBuyCity.buyPrice,
    blackMarketSellPrice,
    setupFee,
    transactionTax,
    netProfit,
    profitPercentage,
    isProfitable: netProfit > 0,
    isPremium,
  };
}

/**
 * Format profit calculation for display
 */
export function formatProfitDisplay(profit: ProfitCalculation): string {
  return `Buy: ${profit.bestBuyCity} @ ${profit.bestBuyPrice.toLocaleString()} → Sell: Black Market @ ${profit.blackMarketSellPrice.toLocaleString()} | Profit: ${profit.netProfit.toLocaleString()} (${profit.profitPercentage.toFixed(2)}%)`;
}

/**
 * Get all profitable trading routes sorted by profit
 */
export function getAllProfitableRoutes(
  cityPrices: Array<{ city: string; buyPrice: number }>,
  blackMarketSellPrice: number,
  isPremium: boolean = false
): TradingRoute[] {
  const routes: TradingRoute[] = [];

  for (const { city, buyPrice } of cityPrices) {
    if (buyPrice <= 0) continue;

    const route = calculateTradeProfit(buyPrice, blackMarketSellPrice, isPremium);
    route.buyCity = city;

    if (route.netProfit > 0) {
      routes.push(route);
    }
  }

  // Sort by profit descending
  return routes.sort((a, b) => b.netProfit - a.netProfit);
}
