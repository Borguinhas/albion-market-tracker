import axios from "axios";

const API_BASE = "https://europe.albion-online-data.com/api/v2/stats";

export interface PriceData {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_min_date: string;
  sell_price_max: number;
  sell_price_max_date: string;
  buy_price_min: number;
  buy_price_min_date: string;
  buy_price_max: number;
  buy_price_max_date: string;
}

export interface HistoricalPrice {
  location: string;
  timestamp: string;
  avg_price: number;
  price_min: number;
  price_max: number;
  volume: number;
}

/**
 * List of valid Albion cities (excludes Black Market for buying)
 */
const VALID_CITIES = [
  "Bridgewatch",
  "Brecilien",
  "Caerleon",
  "Fort Sterling",
  "Lymhurst",
  "Martlock",
];

/**
 * Fetch current prices for items from all cities
 * Filters out Black Market from buy prices (only for selling)
 */
export async function fetchCurrentPrices(itemIds: string[]): Promise<PriceData[]> {
  try {
    const itemsQuery = itemIds.join(",");
    const response = await axios.get<PriceData[]>(
      `${API_BASE}/prices/${itemsQuery}`
    );

    // Filter to only include valid cities (exclude Black Market for buying)
    return response.data.filter((price) => VALID_CITIES.includes(price.city));
  } catch (error) {
    console.error("Error fetching current prices:", error);
    throw new Error(`API error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Fetch historical prices for items
 */
export async function fetchHistoricalPrices(
  itemIds: string[],
  startDate: Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  endDate: Date = new Date()
): Promise<HistoricalPrice[]> {
  try {
    const itemsQuery = itemIds.join(",");
    const params = getDateRange(startDate, endDate);

    const response = await axios.get<HistoricalPrice[]>(
      `${API_BASE}/history/${itemsQuery}`,
      { params }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching historical prices:", error);
    throw new Error(`API error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Format date for API (DD-MM-YYYY)
 */
export function formatDateForAPI(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Get date range parameters for API
 */
export function getDateRange(startDate: Date, endDate: Date) {
  return {
    date: formatDateForAPI(startDate),
    end_date: formatDateForAPI(endDate),
    "time-scale": "24",
  };
}

/**
 * Parse item ID to get tier and name
 * e.g., "T4_BAG" -> { tier: 4, name: "BAG" }
 */
export function parseItemId(itemId: string): { tier: number; name: string } {
  const match = itemId.match(/T(\d+)_(.*)/);
  if (match) {
    return {
      tier: parseInt(match[1], 10),
      name: match[2].replace(/_/g, " "),
    };
  }
  return { tier: 0, name: itemId };
}

/**
 * Get best buy and sell opportunities from price data
 * Only considers valid cities (no Black Market for buying)
 */
export function findBestPrices(prices: PriceData[]) {
  let bestBuy = { city: "", price: Infinity, quality: 0 };
  let bestSell = { city: "", price: 0, quality: 0 };

  prices.forEach((price) => {
    // Find best buy price (lowest buy_price_max from cities)
    if (price.buy_price_max > 0 && price.buy_price_max < bestBuy.price) {
      bestBuy = {
        city: price.city,
        price: price.buy_price_max,
        quality: price.quality,
      };
    }

    // Find best sell price (highest sell_price_min from cities)
    if (price.sell_price_min > bestSell.price) {
      bestSell = {
        city: price.city,
        price: price.sell_price_min,
        quality: price.quality,
      };
    }
  });

  return { bestBuy, bestSell };
}

/**
 * Calculate average price from all city prices
 */
export function getAveragePrice(prices: PriceData[]): number {
  if (prices.length === 0) return 0;
  const sum = prices.reduce((acc, price) => acc + price.buy_price_max, 0);
  return Math.round(sum / prices.length);
}

/**
 * Calculate profit between two prices
 */
export function calculateProfit(buyPrice: number, sellPrice: number): number {
  return sellPrice - buyPrice;
}

/**
 * Get Black Market sell price from price data
 * Black Market is the ONLY destination for selling items
 */
export function getBlackMarketSellPrice(prices: PriceData[]): { price: number; quality: number } | null {
  const blackMarketPrices = prices.filter((p) => p.city === "Black Market");
  if (blackMarketPrices.length === 0) return null;

  let bestPrice = { price: 0, quality: 0 };
  blackMarketPrices.forEach((price) => {
    if (price.sell_price_min > bestPrice.price) {
      bestPrice = {
        price: price.sell_price_min,
        quality: price.quality,
      };
    }
  });

  return bestPrice.price > 0 ? bestPrice : null;
}

/**
 * Get all city prices sorted by buy price (lowest first)
 * Useful for finding best buying opportunities
 */
export function getCityPricesSorted(prices: PriceData[]): Array<{ city: string; buyPrice: number; sellPrice: number }> {
  return prices
    .filter((p) => VALID_CITIES.includes(p.city))
    .map((p) => ({
      city: p.city,
      buyPrice: p.buy_price_max,
      sellPrice: p.sell_price_min,
    }))
    .sort((a, b) => a.buyPrice - b.buyPrice);
}

/**
 * Get list of valid trading cities
 */
export function getValidCities(): string[] {
  return VALID_CITIES;
}
