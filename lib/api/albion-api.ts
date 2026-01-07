/**
 * Albion Online Data API Service
 * Handles all API calls to fetch market prices and historical data
 */

const API_BASE_URL = "https://europe.albion-online-data.com/api/v2";

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

export interface HistoryDataPoint {
  item_count: number;
  avg_price: number;
  timestamp: string;
}

export interface HistoryData {
  location: string;
  item_id: string;
  quality: number;
  data: HistoryDataPoint[];
}

export interface TrackedItem {
  id: string;
  itemId: string;
  name: string;
  tier: number;
  addedAt: string;
  lastUpdated: string;
}

/**
 * Fetch current prices for specified items
 * @param itemIds - Array of item IDs (e.g., ['T4_BAG', 'T5_BAG'])
 * @returns Array of price data for all cities and qualities
 */
export async function fetchCurrentPrices(itemIds: string[]): Promise<PriceData[]> {
  try {
    const itemsString = itemIds.join(",");
    const response = await fetch(
      `${API_BASE_URL}/stats/prices/${itemsString}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data as PriceData[];
  } catch (error) {
    console.error("Error fetching current prices:", error);
    throw error;
  }
}

/**
 * Fetch historical price data for specified items
 * @param itemIds - Array of item IDs
 * @param startDate - Start date in format 'DD-MM-YYYY'
 * @param endDate - End date in format 'DD-MM-YYYY'
 * @param timeScale - Time scale in hours (default: 24 for daily)
 * @returns Array of historical price data
 */
export async function fetchHistoricalPrices(
  itemIds: string[],
  startDate: string,
  endDate: string,
  timeScale: number = 24
): Promise<HistoryData[]> {
  try {
    const itemsString = itemIds.join(",");
    const response = await fetch(
      `${API_BASE_URL}/stats/history/${itemsString}?date=${startDate}&end_date=${endDate}&time-scale=${timeScale}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data as HistoryData[];
  } catch (error) {
    console.error("Error fetching historical prices:", error);
    throw error;
  }
}

/**
 * Format date to DD-MM-YYYY format
 */
export function formatDateForAPI(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Get date range for last N days
 */
export function getDateRange(daysBack: number = 7): { start: string; end: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  return {
    start: formatDateForAPI(startDate),
    end: formatDateForAPI(endDate),
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
 */
export function findBestPrices(prices: PriceData[]) {
  let bestBuy = { city: "", price: Infinity, quality: 0 };
  let bestSell = { city: "", price: 0, quality: 0 };

  prices.forEach((price) => {
    if (price.buy_price_max > 0 && price.buy_price_max < bestBuy.price) {
      bestBuy = {
        city: price.city,
        price: price.buy_price_max,
        quality: price.quality,
      };
    }

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
 * Calculate profit margin between buy and sell
 */
export function calculateProfit(buyPrice: number, sellPrice: number): number {
  if (buyPrice === 0) return 0;
  return ((sellPrice - buyPrice) / buyPrice) * 100;
}

/**
 * Get average price from price data
 */
export function getAveragePrice(prices: PriceData[]): number {
  if (prices.length === 0) return 0;

  const total = prices.reduce((sum, price) => {
    const avg = (price.buy_price_max + price.sell_price_min) / 2;
    return sum + (avg > 0 ? avg : 0);
  }, 0);

  return Math.round(total / prices.length);
}
