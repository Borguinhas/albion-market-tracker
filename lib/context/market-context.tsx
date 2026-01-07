import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useReducer, ReactNode } from "react";
import {
  fetchCurrentPrices,
  fetchHistoricalPrices,
  formatDateForAPI,
  getDateRange,
  parseItemId,
  PriceData,
  HistoryData,
} from "@/lib/api/albion-api";

export interface TrackedItem {
  id: string;
  itemId: string;
  name: string;
  tier: number;
  addedAt: string;
}

export interface MarketData {
  itemId: string;
  prices: PriceData[];
  lastUpdated: string;
  loading: boolean;
  error: string | null;
}

export interface HistoricalData {
  itemId: string;
  history: HistoryData[];
  lastUpdated: string;
  loading: boolean;
  error: string | null;
}

interface MarketState {
  trackedItems: TrackedItem[];
  marketData: Record<string, MarketData>;
  historicalData: Record<string, HistoricalData>;
  loading: boolean;
  error: string | null;
  lastRefresh: string | null;
}

type MarketAction =
  | { type: "ADD_ITEM"; payload: TrackedItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "SET_TRACKED_ITEMS"; payload: TrackedItem[] }
  | { type: "SET_PRICES"; payload: { itemId: string; prices: PriceData[] } }
  | { type: "SET_PRICE_LOADING"; payload: { itemId: string; loading: boolean } }
  | { type: "SET_PRICE_ERROR"; payload: { itemId: string; error: string | null } }
  | { type: "SET_HISTORY"; payload: { itemId: string; history: HistoryData[] } }
  | { type: "SET_HISTORY_LOADING"; payload: { itemId: string; loading: boolean } }
  | { type: "SET_HISTORY_ERROR"; payload: { itemId: string; error: string | null } }
  | { type: "SET_GLOBAL_LOADING"; payload: boolean }
  | { type: "SET_GLOBAL_ERROR"; payload: string | null }
  | { type: "SET_LAST_REFRESH"; payload: string };

const initialState: MarketState = {
  trackedItems: [],
  marketData: {},
  historicalData: {},
  loading: false,
  error: null,
  lastRefresh: null,
};

function marketReducer(state: MarketState, action: MarketAction): MarketState {
  switch (action.type) {
    case "ADD_ITEM":
      return {
        ...state,
        trackedItems: [...state.trackedItems, action.payload],
      };

    case "REMOVE_ITEM": {
      const { [action.payload]: _, ...remainingMarketData } = state.marketData;
      const { [action.payload]: __, ...remainingHistoricalData } = state.historicalData;
      return {
        ...state,
        trackedItems: state.trackedItems.filter((item) => item.id !== action.payload),
        marketData: remainingMarketData,
        historicalData: remainingHistoricalData,
      };
    }

    case "SET_TRACKED_ITEMS":
      return {
        ...state,
        trackedItems: action.payload,
      };

    case "SET_PRICES":
      return {
        ...state,
        marketData: {
          ...state.marketData,
          [action.payload.itemId]: {
            itemId: action.payload.itemId,
            prices: action.payload.prices,
            lastUpdated: new Date().toISOString(),
            loading: false,
            error: null,
          },
        },
      };

    case "SET_PRICE_LOADING":
      return {
        ...state,
        marketData: {
          ...state.marketData,
          [action.payload.itemId]: {
            ...state.marketData[action.payload.itemId],
            loading: action.payload.loading,
          },
        },
      };

    case "SET_PRICE_ERROR":
      return {
        ...state,
        marketData: {
          ...state.marketData,
          [action.payload.itemId]: {
            ...state.marketData[action.payload.itemId],
            error: action.payload.error,
            loading: false,
          },
        },
      };

    case "SET_HISTORY":
      return {
        ...state,
        historicalData: {
          ...state.historicalData,
          [action.payload.itemId]: {
            itemId: action.payload.itemId,
            history: action.payload.history,
            lastUpdated: new Date().toISOString(),
            loading: false,
            error: null,
          },
        },
      };

    case "SET_HISTORY_LOADING":
      return {
        ...state,
        historicalData: {
          ...state.historicalData,
          [action.payload.itemId]: {
            ...state.historicalData[action.payload.itemId],
            loading: action.payload.loading,
          },
        },
      };

    case "SET_HISTORY_ERROR":
      return {
        ...state,
        historicalData: {
          ...state.historicalData,
          [action.payload.itemId]: {
            ...state.historicalData[action.payload.itemId],
            error: action.payload.error,
            loading: false,
          },
        },
      };

    case "SET_GLOBAL_LOADING":
      return {
        ...state,
        loading: action.payload,
      };

    case "SET_GLOBAL_ERROR":
      return {
        ...state,
        error: action.payload,
      };

    case "SET_LAST_REFRESH":
      return {
        ...state,
        lastRefresh: action.payload,
      };

    default:
      return state;
  }
}

interface MarketContextType {
  state: MarketState;
  addItem: (itemId: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  refreshPrices: (itemIds?: string[]) => Promise<void>;
  refreshHistory: (itemIds?: string[], daysBack?: number) => Promise<void>;
  loadTrackedItems: () => Promise<void>;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export function MarketProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(marketReducer, initialState);

  // Load tracked items from storage on mount
  useEffect(() => {
    loadTrackedItems();
  }, []);

  const loadTrackedItems = async () => {
    try {
      const stored = await AsyncStorage.getItem("trackedItems");
      if (stored) {
        const items = JSON.parse(stored) as TrackedItem[];
        dispatch({ type: "SET_TRACKED_ITEMS", payload: items });
      }
    } catch (error) {
      console.error("Error loading tracked items:", error);
    }
  };

  const addItem = async (itemId: string) => {
    try {
      const { tier, name } = parseItemId(itemId);
      const newItem: TrackedItem = {
        id: `${itemId}_${Date.now()}`,
        itemId,
        name,
        tier,
        addedAt: new Date().toISOString(),
      };

      dispatch({ type: "ADD_ITEM", payload: newItem });

      // Save to storage
      const updated = [...state.trackedItems, newItem];
      await AsyncStorage.setItem("trackedItems", JSON.stringify(updated));

      // Fetch prices for new item
      await refreshPrices([itemId]);
    } catch (error) {
      console.error("Error adding item:", error);
      dispatch({ type: "SET_GLOBAL_ERROR", payload: "Failed to add item" });
    }
  };

  const removeItem = async (id: string) => {
    try {
      dispatch({ type: "REMOVE_ITEM", payload: id });

      // Save to storage
      const updated = state.trackedItems.filter((item) => item.id !== id);
      await AsyncStorage.setItem("trackedItems", JSON.stringify(updated));
    } catch (error) {
      console.error("Error removing item:", error);
      dispatch({ type: "SET_GLOBAL_ERROR", payload: "Failed to remove item" });
    }
  };

  const refreshPrices = async (itemIds?: string[]) => {
    try {
      const ids = itemIds || state.trackedItems.map((item) => item.itemId);
      if (ids.length === 0) return;

      dispatch({ type: "SET_GLOBAL_LOADING", payload: true });

      const prices = await fetchCurrentPrices(ids);

      // Group prices by item ID
      const groupedByItem = prices.reduce(
        (acc, price) => {
          if (!acc[price.item_id]) {
            acc[price.item_id] = [];
          }
          acc[price.item_id].push(price);
          return acc;
        },
        {} as Record<string, PriceData[]>
      );

      // Update state for each item
      Object.entries(groupedByItem).forEach(([itemId, itemPrices]) => {
        dispatch({ type: "SET_PRICES", payload: { itemId, prices: itemPrices } });
      });

      dispatch({ type: "SET_LAST_REFRESH", payload: new Date().toISOString() });
      dispatch({ type: "SET_GLOBAL_LOADING", payload: false });
    } catch (error) {
      console.error("Error refreshing prices:", error);
      dispatch({ type: "SET_GLOBAL_ERROR", payload: "Failed to refresh prices" });
      dispatch({ type: "SET_GLOBAL_LOADING", payload: false });
    }
  };

  const refreshHistory = async (itemIds?: string[], daysBack: number = 7) => {
    try {
      const ids = itemIds || state.trackedItems.map((item) => item.itemId);
      if (ids.length === 0) return;

      dispatch({ type: "SET_GLOBAL_LOADING", payload: true });

      const { start, end } = getDateRange(daysBack);
      const history = await fetchHistoricalPrices(ids, start, end);

      // Group history by item ID
      const groupedByItem = history.reduce(
        (acc, item) => {
          if (!acc[item.item_id]) {
            acc[item.item_id] = [];
          }
          acc[item.item_id].push(item);
          return acc;
        },
        {} as Record<string, HistoryData[]>
      );

      // Update state for each item
      Object.entries(groupedByItem).forEach(([itemId, itemHistory]) => {
        dispatch({ type: "SET_HISTORY", payload: { itemId, history: itemHistory } });
      });

      dispatch({ type: "SET_GLOBAL_LOADING", payload: false });
    } catch (error) {
      console.error("Error refreshing history:", error);
      dispatch({ type: "SET_GLOBAL_ERROR", payload: "Failed to refresh history" });
      dispatch({ type: "SET_GLOBAL_LOADING", payload: false });
    }
  };

  const value: MarketContextType = {
    state,
    addItem,
    removeItem,
    refreshPrices,
    refreshHistory,
    loadTrackedItems,
  };

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (context === undefined) {
    throw new Error("useMarket must be used within a MarketProvider");
  }
  return context;
}
